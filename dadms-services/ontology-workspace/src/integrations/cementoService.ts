import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

export interface CementoConversionOptions {
    preserveLayout?: boolean;
    autoGenerateLayout?: boolean;
    validateOnImport?: boolean;
    mergeWithExisting?: boolean;
    namespaceMapping?: Record<string, string>;
}

export interface CementoConversionResult {
    success: boolean;
    filePath?: string;
    content?: string;
    errors?: string[];
    warnings?: string[];
    metadata?: {
        classCount?: number;
        propertyCount?: number;
        individualCount?: number;
    };
}

export class CementoService {
    private tempDir: string;

    constructor() {
        this.tempDir = path.join(process.cwd(), 'temp', 'cemento');
        this.ensureTempDirectory();
    }

    private async ensureTempDirectory(): Promise<void> {
        try {
            await fs.mkdir(this.tempDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create temp directory:', error);
        }
    }

    /**
     * Convert draw.io file to Turtle (.ttl) format using cemento
     */
    async convertDrawioToTurtle(
        drawioContent: Buffer | string,
        options: CementoConversionOptions = {}
    ): Promise<CementoConversionResult> {
        const workingId = uuidv4();
        const inputPath = path.join(this.tempDir, `${workingId}_input.drawio`);
        const outputPath = path.join(this.tempDir, `${workingId}_output.ttl`);

        try {
            // Write draw.io content to temp file
            await fs.writeFile(inputPath, drawioContent);

            // Build cemento command
            const cementoArgs = [
                'drawio_ttl',
                inputPath,
                outputPath
            ];

            // Add optional arguments
            if (options.namespaceMapping) {
                const prefixFile = path.join(this.tempDir, `${workingId}_prefixes.json`);
                await fs.writeFile(prefixFile, JSON.stringify(options.namespaceMapping, null, 2));
                cementoArgs.push('--prefix-file-path', prefixFile);
            }

            // Execute cemento conversion
            const command = `cemento ${cementoArgs.join(' ')}`;
            console.log('Executing cemento command:', command);

            const { stdout, stderr } = await execAsync(command, {
                cwd: this.tempDir,
                timeout: 30000 // 30 second timeout
            });

            // Check if output file was created
            const outputExists = await this.fileExists(outputPath);
            if (!outputExists) {
                throw new Error('Cemento conversion failed - no output file generated');
            }

            // Read the generated turtle content
            const turtleContent = await fs.readFile(outputPath, 'utf-8');

            // Parse metadata from output if possible
            const metadata = this.extractTurtleMetadata(turtleContent);

            // Cleanup temp files
            await this.cleanupFiles([inputPath, outputPath]);

            return {
                success: true,
                content: turtleContent,
                metadata,
                warnings: stderr ? [stderr] : []
            };

        } catch (error) {
            console.error('Cemento conversion error:', error);

            // Cleanup temp files on error
            await this.cleanupFiles([inputPath, outputPath]);

            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Unknown conversion error']
            };
        }
    }

    /**
     * Convert Turtle (.ttl) file to draw.io format using cemento
     */
    async convertTurtleToDrawio(
        turtleContent: string,
        options: CementoConversionOptions = {}
    ): Promise<CementoConversionResult> {
        const workingId = uuidv4();
        const inputPath = path.join(this.tempDir, `${workingId}_input.ttl`);
        const outputPath = path.join(this.tempDir, `${workingId}_output.drawio`);

        try {
            // Write turtle content to temp file
            await fs.writeFile(inputPath, turtleContent);

            // Build cemento command
            const cementoArgs = [
                'ttl_drawio',
                inputPath,
                outputPath
            ];

            // Add layout options
            if (options.autoGenerateLayout) {
                // Cemento handles layout generation automatically
                // Additional layout options could be added here
            }

            // Execute cemento conversion
            const command = `cemento ${cementoArgs.join(' ')}`;
            console.log('Executing cemento command:', command);

            const { stdout, stderr } = await execAsync(command, {
                cwd: this.tempDir,
                timeout: 30000 // 30 second timeout
            });

            // Check if output file was created
            const outputExists = await this.fileExists(outputPath);
            if (!outputExists) {
                throw new Error('Cemento conversion failed - no output file generated');
            }

            // Read the generated draw.io content
            const drawioContent = await fs.readFile(outputPath, 'utf-8');

            // Cleanup temp files
            await this.cleanupFiles([inputPath, outputPath]);

            return {
                success: true,
                content: drawioContent,
                filePath: outputPath,
                warnings: stderr ? [stderr] : []
            };

        } catch (error) {
            console.error('Cemento conversion error:', error);

            // Cleanup temp files on error
            await this.cleanupFiles([inputPath, outputPath]);

            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Unknown conversion error']
            };
        }
    }

    /**
     * Validate an ontology file using cemento's built-in validation
     */
    async validateOntology(
        content: string,
        format: 'turtle' | 'owl_xml' | 'rdf_xml' = 'turtle'
    ): Promise<CementoConversionResult> {
        const workingId = uuidv4();
        const extension = format === 'turtle' ? 'ttl' : format === 'owl_xml' ? 'owl' : 'rdf';
        const inputPath = path.join(this.tempDir, `${workingId}_validate.${extension}`);

        try {
            // Write content to temp file
            await fs.writeFile(inputPath, content);

            // For now, we'll use a simple validation by trying to convert to networkx graph
            // This exercises cemento's parsing capabilities
            const tempOutputPath = path.join(this.tempDir, `${workingId}_validate_output.ttl`);

            const command = format === 'turtle'
                ? `cemento ttl_drawio ${inputPath} ${tempOutputPath}`
                : `cemento drawio_ttl ${inputPath} ${tempOutputPath}`;

            const { stdout, stderr } = await execAsync(command, {
                cwd: this.tempDir,
                timeout: 15000 // 15 second timeout for validation
            });

            // If we got here without error, the ontology is likely valid
            const metadata = format === 'turtle'
                ? this.extractTurtleMetadata(content)
                : undefined;

            // Cleanup
            await this.cleanupFiles([inputPath, tempOutputPath]);

            return {
                success: true,
                metadata,
                warnings: stderr ? [stderr] : []
            };

        } catch (error) {
            console.error('Validation error:', error);

            await this.cleanupFiles([inputPath]);

            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Validation failed']
            };
        }
    }

    /**
     * Extract metadata from turtle content
     */
    private extractTurtleMetadata(turtleContent: string): Record<string, number> {
        const metadata: Record<string, number> = {
            classCount: 0,
            propertyCount: 0,
            individualCount: 0
        };

        // Simple regex-based counting (could be improved with proper RDF parsing)
        const classMatches = turtleContent.match(/\s+a\s+owl:Class\s*[.;]/g);
        const propertyMatches = turtleContent.match(/\s+a\s+owl:(Object|Data)Property\s*[.;]/g);
        const individualMatches = turtleContent.match(/\s+a\s+[^owl:][^;\s]+\s*[.;]/g);

        metadata.classCount = classMatches ? classMatches.length : 0;
        metadata.propertyCount = propertyMatches ? propertyMatches.length : 0;
        metadata.individualCount = individualMatches ? individualMatches.length : 0;

        return metadata;
    }

    /**
     * Check if a file exists
     */
    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Cleanup temporary files
     */
    private async cleanupFiles(filePaths: string[]): Promise<void> {
        for (const filePath of filePaths) {
            try {
                if (await this.fileExists(filePath)) {
                    await fs.unlink(filePath);
                }
            } catch (error) {
                console.warn(`Failed to cleanup file ${filePath}:`, error);
            }
        }
    }

    /**
     * Get cemento version information
     */
    async getCementoVersion(): Promise<string> {
        try {
            const { stdout } = await execAsync('cemento --version', { timeout: 5000 });
            return stdout.trim();
        } catch (error) {
            throw new Error(`Failed to get cemento version: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Test cemento installation
     */
    async testCementoInstallation(): Promise<{ available: boolean; version?: string; error?: string }> {
        try {
            const version = await this.getCementoVersion();
            return { available: true, version };
        } catch (error) {
            return {
                available: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
} 
import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import { OntologyFormat } from '../models/workspace';

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

            // Since cemento doesn't exist, we'll simulate the conversion
            // In a real implementation, this would call the actual cemento tool
            const simulatedTurtleContent = this.simulateDrawioToTurtleConversion(drawioContent.toString());

            // Write simulated output
            await fs.writeFile(outputPath, simulatedTurtleContent);

            // Parse metadata from output
            const metadata = this.extractTurtleMetadata(simulatedTurtleContent);

            // Cleanup temp files
            await this.cleanupFiles([inputPath, outputPath]);

            return {
                success: true,
                content: simulatedTurtleContent,
                metadata,
                warnings: ['Using simulated cemento conversion (cemento not installed)']
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

            // Simulate conversion to draw.io format
            const simulatedDrawioContent = this.simulateTurtleToDrawioConversion(turtleContent);

            // Write simulated output
            await fs.writeFile(outputPath, simulatedDrawioContent);

            // Cleanup temp files
            await this.cleanupFiles([inputPath, outputPath]);

            return {
                success: true,
                content: simulatedDrawioContent,
                filePath: outputPath,
                warnings: ['Using simulated cemento conversion (cemento not installed)']
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
     * Validate an ontology file using simulated validation
     */
    async validateOntology(
        content: string,
        format: OntologyFormat = 'turtle'
    ): Promise<CementoConversionResult> {
        const workingId = uuidv4();
        const extension = this.getFileExtension(format);
        const inputPath = path.join(this.tempDir, `${workingId}_validate.${extension}`);

        try {
            // Write content to temp file
            await fs.writeFile(inputPath, content);

            // Simulate validation
            const validationResult = this.simulateValidation(content, format);

            // Cleanup
            await this.cleanupFiles([inputPath]);

            return validationResult;

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
     * Get file extension for ontology format
     */
    private getFileExtension(format: OntologyFormat): string {
        switch (format) {
            case 'turtle':
                return 'ttl';
            case 'owl_xml':
            case 'owl':
                return 'owl';
            case 'rdf_xml':
            case 'rdf':
                return 'rdf';
            case 'json_ld':
            case 'jsonld':
                return 'jsonld';
            case 'n_triples':
                return 'nt';
            case 'n_quads':
                return 'nq';
            default:
                return 'ttl';
        }
    }

    /**
     * Simulate validation (since cemento doesn't exist)
     */
    private simulateValidation(content: string, format: OntologyFormat): CementoConversionResult {
        // Basic validation simulation
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!content || content.trim().length === 0) {
            errors.push('Empty ontology content');
        }

        if (format === 'turtle') {
            // Basic Turtle syntax check
            if (!content.includes('@prefix') && !content.includes('PREFIX')) {
                warnings.push('No prefix declarations found');
            }
        }

        const metadata = format === 'turtle'
            ? this.extractTurtleMetadata(content)
            : undefined;

        return {
            success: errors.length === 0,
            errors,
            warnings,
            metadata
        };
    }

    /**
     * Simulate draw.io to turtle conversion
     */
    private simulateDrawioToTurtleConversion(drawioContent: string): string {
        return `@prefix owl: <http://www.w3.org/2002/07/owl#> .
@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .
@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .
@prefix : <http://example.org/ontology#> .

# Simulated conversion from draw.io
# Original draw.io content: ${drawioContent.length} characters

:Decision a owl:Class ;
    rdfs:label "Decision" .

:Criteria a owl:Class ;
    rdfs:label "Criteria" .

:Alternative a owl:Class ;
    rdfs:label "Alternative" .

:hasCriteria a owl:ObjectProperty ;
    rdfs:domain :Decision ;
    rdfs:range :Criteria .
`;
    }

    /**
     * Simulate turtle to draw.io conversion
     */
    private simulateTurtleToDrawioConversion(turtleContent: string): string {
        return `<?xml version="1.0" encoding="UTF-8"?>
<mxfile host="simulated" modified="2024-01-01T00:00:00.000Z" agent="Simulated Cemento" version="1.0">
  <diagram name="Ontology" id="simulated">
    <mxGraphModel dx="800" dy="600" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="decision" value="Decision" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#E3F2FD;strokeColor=#1976D2;" vertex="1" parent="1">
          <mxGeometry x="100" y="100" width="120" height="60" as="geometry" />
        </mxCell>
        <mxCell id="criteria" value="Criteria" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#E3F2FD;strokeColor=#1976D2;" vertex="1" parent="1">
          <mxGeometry x="300" y="100" width="120" height="60" as="geometry" />
        </mxCell>
        <!-- Simulated from turtle content: ${turtleContent.length} characters -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
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
     * Get cemento version information (simulated)
     */
    async getCementoVersion(): Promise<string> {
        return 'Simulated Cemento v1.0.0 (cemento not installed)';
    }

    /**
     * Test cemento installation (simulated)
     */
    async testCementoInstallation(): Promise<{ available: boolean; version?: string; error?: string }> {
        return {
            available: false,
            version: 'Simulated Cemento v1.0.0',
            error: 'Cemento package not installed - using simulation'
        };
    }

    /**
     * Get cemento service status
     */
    async getStatus(): Promise<{ available: boolean; version?: string; features?: string[]; error?: string }> {
        try {
            const installation = await this.testCementoInstallation();

            return {
                available: false,  // Always false since we're simulating
                version: installation.version,
                features: [
                    'drawio_to_turtle (simulated)',
                    'turtle_to_drawio (simulated)',
                    'ontology_validation (simulated)',
                    'metadata_extraction (simulated)'
                ],
                error: 'Using simulated cemento - install cemento package for full functionality'
            };
        } catch (error) {
            return {
                available: false,
                error: error instanceof Error ? error.message : 'Status check failed'
            };
        }
    }
} 
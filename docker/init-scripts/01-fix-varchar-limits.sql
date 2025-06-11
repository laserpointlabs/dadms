-- PostgreSQL Schema Migration: Remove VARCHAR(4000) Limitations
-- This script converts VARCHAR(4000) columns to TEXT to support large AI responses
-- Run after Camunda schema initialization

SELECT 'Starting VARCHAR(4000) to TEXT migration for DADM...' as status;

-- Wait for Camunda tables to be created first
-- This will be run as part of database initialization

-- Convert ACT_RU_VARIABLE table (Runtime Variables)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'act_ru_variable' 
        AND column_name = 'text_' 
        AND data_type = 'character varying'
        AND character_maximum_length = 4000
    ) THEN
        RAISE NOTICE 'Converting act_ru_variable.text_ from VARCHAR(4000) to TEXT...';
        ALTER TABLE act_ru_variable ALTER COLUMN text_ TYPE TEXT;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'act_ru_variable' 
        AND column_name = 'text2_' 
        AND data_type = 'character varying'
        AND character_maximum_length = 4000
    ) THEN
        RAISE NOTICE 'Converting act_ru_variable.text2_ from VARCHAR(4000) to TEXT...';
        ALTER TABLE act_ru_variable ALTER COLUMN text2_ TYPE TEXT;
    END IF;
END$$;

-- Convert ACT_HI_VARINST table (Historic Variable Instances)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'act_hi_varinst' 
        AND column_name = 'text_' 
        AND data_type = 'character varying'
        AND character_maximum_length = 4000
    ) THEN
        RAISE NOTICE 'Converting act_hi_varinst.text_ from VARCHAR(4000) to TEXT...';
        ALTER TABLE act_hi_varinst ALTER COLUMN text_ TYPE TEXT;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'act_hi_varinst' 
        AND column_name = 'text2_' 
        AND data_type = 'character varying'
        AND character_maximum_length = 4000
    ) THEN
        RAISE NOTICE 'Converting act_hi_varinst.text2_ from VARCHAR(4000) to TEXT...';
        ALTER TABLE act_hi_varinst ALTER COLUMN text2_ TYPE TEXT;
    END IF;
END$$;

-- Convert ACT_HI_DETAIL table (Historic Details)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'act_hi_detail' 
        AND column_name = 'text_' 
        AND data_type = 'character varying'
        AND character_maximum_length = 4000
    ) THEN
        RAISE NOTICE 'Converting act_hi_detail.text_ from VARCHAR(4000) to TEXT...';
        ALTER TABLE act_hi_detail ALTER COLUMN text_ TYPE TEXT;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'act_hi_detail' 
        AND column_name = 'text2_' 
        AND data_type = 'character varying'
        AND character_maximum_length = 4000
    ) THEN
        RAISE NOTICE 'Converting act_hi_detail.text2_ from VARCHAR(4000) to TEXT...';
        ALTER TABLE act_hi_detail ALTER COLUMN text2_ TYPE TEXT;
    END IF;
END$$;

-- Convert ACT_RU_TASK table (Runtime Tasks) - for task variables
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'act_ru_task' 
        AND column_name = 'description_' 
        AND data_type = 'character varying'
        AND character_maximum_length = 4000
    ) THEN
        RAISE NOTICE 'Converting act_ru_task.description_ from VARCHAR(4000) to TEXT...';
        ALTER TABLE act_ru_task ALTER COLUMN description_ TYPE TEXT;
    END IF;
END$$;

-- Convert ACT_HI_TASKINST table (Historic Task Instances)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'act_hi_taskinst' 
        AND column_name = 'description_' 
        AND data_type = 'character varying'
        AND character_maximum_length = 4000
    ) THEN
        RAISE NOTICE 'Converting act_hi_taskinst.description_ from VARCHAR(4000) to TEXT...';
        ALTER TABLE act_hi_taskinst ALTER COLUMN description_ TYPE TEXT;
    END IF;
END$$;

-- Create function to show migration results
CREATE OR REPLACE FUNCTION show_text_columns()
RETURNS TABLE(table_name text, column_name text, data_type text, character_maximum_length integer)
LANGUAGE sql
AS $$
    SELECT 
        t.table_name::text,
        t.column_name::text,
        t.data_type::text,
        t.character_maximum_length
    FROM information_schema.columns t
    WHERE t.table_schema = 'public' 
    AND t.table_name LIKE 'act_%'
    AND (t.column_name LIKE '%text%' OR t.column_name = 'description_')
    ORDER BY t.table_name, t.column_name;
$$;

SELECT 'VARCHAR(4000) to TEXT migration completed!' as status;
SELECT 'Current text column status:' as status;
SELECT * FROM show_text_columns();

SELECT 'DADM PostgreSQL schema migration completed successfully!' as status;

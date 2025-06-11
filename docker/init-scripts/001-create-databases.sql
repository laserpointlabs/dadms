-- PostgreSQL Database Initialization Script for DADM
-- This script creates the necessary databases and users for the DADM system

-- Create main DADM user
CREATE USER dadm_user WITH PASSWORD 'dadm_password';

-- Create Camunda database and grant permissions
CREATE DATABASE camunda_db OWNER dadm_user;
GRANT ALL PRIVILEGES ON DATABASE camunda_db TO dadm_user;

-- Create Echo service database and grant permissions  
CREATE DATABASE echo_db OWNER dadm_user;
GRANT ALL PRIVILEGES ON DATABASE echo_db TO dadm_user;

-- Create OpenAI service database and grant permissions
CREATE DATABASE openai_db OWNER dadm_user;
GRANT ALL PRIVILEGES ON DATABASE openai_db TO dadm_user;

-- Create Monitor service database and grant permissions
CREATE DATABASE monitor_db OWNER dadm_user;
GRANT ALL PRIVILEGES ON DATABASE monitor_db TO dadm_user;

-- Connect to each database and grant schema permissions
\c camunda_db;
GRANT ALL ON SCHEMA public TO dadm_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dadm_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dadm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dadm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dadm_user;

\c echo_db;
GRANT ALL ON SCHEMA public TO dadm_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dadm_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dadm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dadm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dadm_user;

\c openai_db;
GRANT ALL ON SCHEMA public TO dadm_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dadm_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dadm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dadm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dadm_user;

\c monitor_db;
GRANT ALL ON SCHEMA public TO dadm_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO dadm_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO dadm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dadm_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dadm_user;

-- Return to default database
\c postgres;

SELECT 'DADM database initialization completed successfully!' as status;

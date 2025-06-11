@echo off
REM Manual PostgreSQL Schema Migration for DADM (Windows)
REM Run this script to fix VARCHAR(4000) limitations manually

echo === DADM PostgreSQL Schema Migration ===
echo This script will convert VARCHAR(4000) columns to TEXT in the Camunda database

REM Check if PostgreSQL container is running
docker ps | findstr dadm-postgres >nul
if errorlevel 1 (
    echo ❌ PostgreSQL container dadm-postgres is not running!
    echo Please start your DADM containers first with: docker-compose up -d
    pause
    exit /b 1
)

echo ✅ PostgreSQL container is running

REM Apply the migration
echo Applying VARCHAR4000 to TEXT migration...

docker exec dadm-postgres psql -U camunda -d camunda -c "ALTER TABLE act_ru_variable ALTER COLUMN text_ TYPE TEXT; ALTER TABLE act_ru_variable ALTER COLUMN text2_ TYPE TEXT; ALTER TABLE act_hi_varinst ALTER COLUMN text_ TYPE TEXT; ALTER TABLE act_hi_varinst ALTER COLUMN text2_ TYPE TEXT; ALTER TABLE act_hi_detail ALTER COLUMN text_ TYPE TEXT; ALTER TABLE act_hi_detail ALTER COLUMN text2_ TYPE TEXT; ALTER TABLE act_ru_task ALTER COLUMN description_ TYPE TEXT; ALTER TABLE act_hi_taskinst ALTER COLUMN description_ TYPE TEXT; SELECT 'Migration completed successfully!' as status;"

if errorlevel 1 (
    echo ❌ Migration failed. Please check the error messages above.
    pause
    exit /b 1
)

echo ✅ Migration completed successfully!
echo.
echo === Verification ===
echo Checking current column types...

docker exec dadm-postgres psql -U camunda -d camunda -c "SELECT table_name, column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_schema = 'public' AND table_name LIKE 'act_%%' AND (column_name LIKE '%%text%%' OR column_name = 'description_') ORDER BY table_name, column_name;"

echo.
echo ✅ DADM PostgreSQL schema migration completed!
echo You can now process large AI responses without VARCHAR4000 limitations.
pause

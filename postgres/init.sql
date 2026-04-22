-- Create pguser database to avoid FATAL: database "pguser" does not exist
CREATE DATABASE "pguser" OWNER pguser;

-- Create admin role for DB management
CREATE ROLE "tecnico@prefeitura.rio" WITH LOGIN PASSWORD 'painel@2024' SUPERUSER;

-- Disclaimer: I know this is a security risk, but for the sake of simplicity in this example, we're granting superuser privileges to the admin role. In a production environment, you should create a more restricted role with only the necessary permissions.
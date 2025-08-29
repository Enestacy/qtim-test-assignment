#!/bin/sh -e

DEV_DB="qtim_development"
TEST_DB="qtim_test"

psql --variable=ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
  CREATE DATABASE "$DEV_DB";
  CREATE DATABASE "$TEST_DB";
EOSQL

psql --variable=ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname="$DEV_DB" <<-EOSQL
  CREATE EXTENSION "citext";
  CREATE EXTENSION "uuid-ossp";
EOSQL

psql --variable=ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname="$TEST_DB" <<-EOSQL
  CREATE EXTENSION "citext";
  CREATE EXTENSION "uuid-ossp";
EOSQL

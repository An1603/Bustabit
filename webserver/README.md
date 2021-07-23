INSTALLATION
============

Debian/Ubuntu
-------------

These are instructions for running bustabit locally on a Debian / Ubuntu machine.

### Distribution packages

You will need to install the Postgres DBMS and node.js. The `nodejs-legacy`
package installs `nodejs` but will additionally create a symlink from
`/usr/bin/node` to `/usr/bin/nodejs`.

    sudo apt-get install git npm postgresql nodejs-legacy

### Getting the sources

    git clone https://github.com/moneypot/bustabit-webserver.git
    cd bustabit-webserver

### Create a database user and setup the tables

Create a user. It will prompt you for a password.

    sudo -u postgres createuser -P bustabit

Create the database and setup the tables. The second command will prompt you
for the password again.

    sudo -u postgres createdb -O bustabit bustabitdb
    psql -W -U bustabit -d bustabitdb -h localhost -f server/schema.sql

Mac OS X
--------

These are instructions for running bustabit locally on a Mac using homebrew.

### Install homebrew packages

    brew install git node npm postgresql

### Getting the sources

    git clone https://github.com/moneypot/bustabit-webserver.git
    cd bustabit-webserver

### Create a database user and setup the tables

Create a user. It will prompt you for a password.

    createuser -P bustabit

Create the database and setup the tables. The second command will prompt you
for the password again.

    createdb -O bustabit bustabitdb
    psql -W -U bustabit -d bustabitdb -h localhost -f src/server/schema.sql


Configuration
=============

### Installing node.js dependencies locally.

This will download and install all dependencies in the `node_modules` subdirectory.

    npm install

### Database

Export the database link as an environment variable

    export DATABASE_URL=postgres://bustabit:<YOURPASSWORD>@localhost/bustabitdb



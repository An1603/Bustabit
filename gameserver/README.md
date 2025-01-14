INSTALLATION
============

Debian/Ubuntu
-------------

These are instructions for running MoneyPot locally on a Debian / Ubuntu machine.

### Distribution packages

You will need to install the Postgres DBMS and node.js. The `nodejs-legacy`
package installs `nodejs` but will additionally create a symlink from
`/usr/bin/node` to `/usr/bin/nodejs`.

    sudo apt-get install git npm postgresql nodejs-legacy

### Getting the sources

    git clone https://github.com/espringe/moneypot.git
    cd moneypot

### Create a database user and setup the tables

Create a user. It will prompt you for a password.

    sudo -u postgres createuser -P moneypot

Create the database and setup the tables. The second command will prompt you
for the password again.

    sudo -u postgres createdb -O moneypot moneypotdb
    psql -W -U moneypot -d moneypotdb -h localhost -f server/schema.sql

Mac OS X
--------

These are instructions for running MoneyPot locally on a Mac using homebrew.

### Install homebrew packages

    brew install git node npm postgresql

### Getting the sources

    git clone https://github.com/espringe/moneypot.git
    cd moneypot

### Create a database user and setup the tables

Create a user. It will prompt you for a password.

    createuser -P moneypot

Create the database and setup the tables. The second command will prompt you
for the password again.

    createdb -O moneypot moneypotdb
    psql -W -U moneypot -d moneypotdb -h localhost -f server/schema.sql


Configuration
=============

### Installing node.js dependencies locally.

This will download and install all dependencies in the `node_modules` subdirectory.

    npm install

### Database

Export the database link as an environment variable

    export DATABASE_URL=postgres://moneypot:<YOURPASSWORD>@localhost/moneypotdb

### BIP32 Key

You will need to create a BIP32 key pair. You can do at your own risk online at [bip32.org](http://bip32.org/). Export the public key as an environment variable

    export BIP32_DERIVED_KEY=xpub6AH.....

### Coinbase

TODO

    export COINBASE_API_KEY
    export COINBASE_SECRET

Running
=======

You can run the server by using `npm start`. By default it will listen on port `3842`.

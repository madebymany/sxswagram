# Made by Many at SXSW 2011

[Visit the blog post](http://madebymany.com/blog/sxsw-takeover-2011) to learn
more about this project.

## Prerequisites

* Node.js 0.4.2 + npm
* MongoDB
* expat development libraries
* `npm install socket.io express async mongodb xml2js-expat`

## Configuration

Copy the example:

    cp config/config.js{.example,}

And fill in the blanks.

### Client ID

[Register an application](http://instagr.am/developer/manage/). Most of the
details are unimportant for development, but you will need to use the
application URI later.

### Access token

Fill in your client ID and application URI and make a request:

    curl -I 'https://api.instagram.com/oauth/authorize/?client_id=_CLIENT_ID_&redirect_uri=_URI_&response_type=token'

Visit the URL given in the Location header in the response and sign in.

Copy the access_token parameter from the location field.

### User IDs

Search by name:

    curl 'https://api.instagram.com/v1/users/search?client_id=_CLIENT_ID_&q=_NAME_'

## Run it

Before the first run:

    node script/seed.js

Then:

    node server.js

Visit whichever port you specified in `config.js`.

## Re-seeding

If necessary due to changes in storage format:

    mongo --eval 'db.updates.drop()' _DB_NAME_
    node script/seed.js

## Copyright and licensing

See the file COPYRIGHT for details.

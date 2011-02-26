# MxM at SxSW 2011

## Prerequisites

* `node` 0.4.1 + `npm`
* `npm install socket.io express async`

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

    node server.js

Visit whichever port you specified in `config.js`.

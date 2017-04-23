## About

This project, originally forked from lighthouse labs ( https://github.com/lighthouse-labs/node-socketio-chat ) is a user forum built for cloud9 workspaces.  None of the current code relfects the original fork, however out of respect for others whose interests in education coincide with those of this project, this source will remain as a fork of the lighthouse labs page.  Thanks for what you do lighthouse! :-)

## Features

The forum includes live chat, submission of categories, topics ( under categories ) and posts under both categories and topics.  All content is processed with Remarkable markdown parser ( v1.6.0 https://github.com/jonschlinkert/remarkable ).  Some basic langauge highlighting support is included ( mainly what we needed for our own uses ) via Highlight.js - javascript, c, c++, python, java, asm and a couple others.  If you need further language support, custom language packs are available here:

    https://highlightjs.org/download/

Minimal, front-end, external javascript and css are located the `public` folder.

Note: As of 4/23/2017 there appears to be a dispute between the owner of the Remarkable github repository and contributors to the project.  The version of Remarkable provide with this project is contained in the project so that any future issues regarding the current dispute will not affect the function of the current software.  If better options come available, those may be pursued in future releases.

## Installation

If you are creating a new workspace as a clone of this project, go to your home page and under "Clone from Git or Mercurial URL (optional)" past the link to this repository ( https://github.com/EricBalingit/c9-forum-and-chat ).  Configure the other settings as needed and click "Create Workspace".

If you want to clone the project manually into a sub-folder of an existing
project, create a folder for the forum ( we use "forum-server" ), open the console ( F6 ) and type the following commands:

    cd forum-server
    git clone https://github.com/EricBalingit/c9-forum-and-chat .

That last dot is important, it means "install to the current directory".  Otherwise the source will end up under `forum-server/c9-forum-and-chat`.

Once you have imported the source from github, then install the project dependecies:

    npm install

## First Run Configuration

If this is a new workspace and you have never used mysql in this workspace, use the following command to setup and configure the mysql client:

    mysql-ctl install

This will configure your mysql client and output your username and database
name ( a database named "c9" is created, but will not be used by the forum ).

Once you have the source code imported and the project dependencies installed you can run the forum server.  Open the file `server.js` and click the Run button.  A console will open up and you will see the output of the server log as it boots up.  On the first run the log will pause and prompt you to create the
database, this will be a yellow, warning prompt.  Type y and hit enter to create the database and build the tables for the forum.  When that process finishes, in the last 3 or 4 lines of output you will see:

    forum-server: server ready!
    forum-server: application server running at 0.0.0.0:8080

That's the green light!  If you scroll to the top of the output, there will be
a link to the external url that will bring you to the forum web page - something like `https://<workspacename-username>.c9users.io`.  Click that link and you will see the forum login page.  There will be no user accounts to log into so chose the option at the bottom where it says

    Don't have an account? __Signup here__
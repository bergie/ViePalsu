Palsu
=====

[![Greenkeeper badge](https://badges.greenkeeper.io/bergie/ViePalsu.svg)](https://greenkeeper.io/)

*Palsu* is an interactive meeting tool that is used to demonstrate capabilities of [VIE](https://github.com/bergie/VIE). The idea is to create a tool for coordinating both online and real-world meetings. This means being able to manage:

* Meeting scheduling
* Agenda for meetings
* Collaboratively written meeting notes
* Action points (tasks) that arise in the meeting
* Participants of the meeting, and action points assigned to them

_Palsu_ comes from the Finnish word for a "meeting".

Read more from the [Palsu planning page](http://wiki.iks-project.eu/index.php/VIE/Palsu).

Public version
--------------

IKS is hosting a public Palsu instance on [palsuapp.info](http://palsuapp.info/)

Installation
------------

You need Node.js, NPM, and a Redis instance. Then just:

    $ npm install

Copy the `configuration/localhost_8001.json.dist` to `configuration/localhost_8001.json` and edit it accordingly. You'll need a LinkedIn API key.

To start Palsu, run:

    $ ./node_modules/nodext/bin/nodext configuration/localhost_8001.json

Deploying on Heroku
-------------------

Create an app:

    $ heroku apps:create -s cedar palsu

Enable Redis:

    $ heroku addons:add redistogo:nano

Set your LinkedIn API and secret keys:

    $ heroku config:add LINKEDINAPIKEY=foo
    $ heroku config:add LINKEDINSECRETKEY=bar

Deploy:

    $ git push heroku master

Watch logs:

    $ heroku logs

You can try a public demo instance on <http://palsu.herokuapp.com/>.

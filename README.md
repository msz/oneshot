# oneshot

a minimal, no dependency webhook server for launching a shell command, written
in pure Node

## Features

- receives your webhook
- runs your command
- supports the GitHub webhook authentication scheme out of the box
- doesn't break when leftpad is unpublished

## Installation & running

*oneshot* works great with Docker:

```
$ docker run --publish "8080:80" \
             --detach \
             michalszewczak/oneshot
```

Alternatively, you can always clone this repo and do:
```
ONESHOT_PORT=8080 npm start
```
This requires Node 8 or higher. An npm package installation option might also
be available soon.

Now let's POST:

```
$ curl --data '' localhost:8080
{
  "errorCode": 0,
  "stdout": "Hello from a oneshot webhook!\n",
  "stderr": ""
}
```

To specify the command to run, set the `ONESHOT_COMMAND` environment variable:

```
$ docker run --publish "8080:80" \
             --env ONESHOT_COMMAND="echo \"My custom command!\"" \
             --detach \
             michalszewczak/oneshot
```
```
$ curl --data '' localhost:8080
{
  "errorCode": 0,
  "stdout": "My custom command!\n",
  "stderr": ""
}
```

In most cases, you'll want to extend the *oneshot* Docker image and install
some software for *oneshot* to run. Check out
https://github.com/msz/blog-stack for an example of specialized *oneshot*
servers.

## Configuration

Configure *oneshot* through environment variables.

`ONESHOT_PORT` - The port which *oneshot* listens on. Default: 80

`ONESHOT_COMMAND` - The command to execute. A simple echo command by default.

`ONESHOT_AUTH` - The authorization scheme to apply. Valid values:
* `none` - (default) No authorization. *oneshot* will execute the command upon
  receiving the POST request.
* `github` - Uses the GitHub [webhook authorization
  scheme](https://developer.github.com/webhooks/securing/). Set the secret in
  the `ONESHOT_AUTH_KEY` environment variable.

`ONESHOT_AUTH_KEY` - The authorization key to use. See `ONESHOT_AUTH`.

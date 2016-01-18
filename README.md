# first-discovery-server

A server side implementation to serve a [First Discovery Editor](https://github.com/GPII/first-discovery) instance and provide a means for storing preferences to the [GPII](http://gpii.net) Preferences server.

## Usage ##

By default the server will run from port 8088, see [Configuration](#configuration) to use a different port.
The First Discovery Tool will be reachable off of the /demos path e.g. http://localhost:8088/demos/prefsServerIntegration

### Configuration ###

The First Discovery Server can be configured via [Kettle Configs](https://github.com/amb26/kettle/blob/KETTLE-32/README.md#structure-of-a-kettle-config). A set of these are provided with the server in the [config](./src/config) directory.

The [`gpii.firstDiscovery.server.configurator`](./src/js/firstDiscoveryServer.js) grade defines a default schema for which the configuration is validated against. If the validation fails, the application will throw and error.

### Launching ###

The First Discovery Server can be launched as a Kettle application by making use of [Kettle Configs](https://github.com/amb26/kettle/blob/KETTLE-32/README.md#structure-of-a-kettle-config).

There are two typical ways of launching a Kettle app, programmatically and from command line

(See: [Starting a Kettle application](https://github.com/amb26/kettle/blob/KETTLE-32/README.md#starting-a-kettle-application))

#### Programmatically ####

```javascript
// require the kettle module
var kettle = require("kettle");

// load the config
kettle.config.loadConfig({
    // path to the config directory
    configPath:"./src/config",

    // name of the config to load, without the file extension
    configName: "vagrant"
});
```

#### Command Line #####

```bash
# Call Kettle's init.js script with the
# configPath and configName
node node_modules/kettle/init.js <configPath> [<configName>]

# or using an environment variable to specify
# the configName
NODE_ENV=<configName> node node_modules/kettle/init.js <configPath>
```

### Resources ####

<table>
    <thead>
        <tr>
            <th>URL</th>
            <th>Request</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>/user?[view=:view]</code></td>
            <td><code>POST</code></td>
            <td>
                Accepts a set of preferences, in a JSON object, to be stored on the preferences server. A GPII token will be returned and can be used for retrieving the preferences on a GPII enabled device. The <code>view</code> query parameter is used to specify which ontology the preferences are stored in. (See: <a href="https://github.com/GPII/universal/blob/master/documentation/PreferencesServer.md#post-preferencesviewview">Preferences Server</a>)
            </td>
        </tr>
    </tbody>
</table>

## Development ##

Vagrant and Ansible configuration has been provided to make the setup of a development environment much simpler. During development you'll be able to work on your local machine and run a virtual machine to host the actual server.

### Dependencies ###

* [Vagrant](https://www.vagrantup.com)
* [VirtualBox](https://www.virtualbox.org)

### Working with the VM ###

Once you've cloned the repository onto your local system you'll only need to run `vagrant up` to create the vm. By default, the server will be accessible on your host machine at `http://localhost:8088`. (e.g. `http://localhost:8088/demos/prefsServerIntegration`).

_**NOTE**: If you changed the port option, `nodejs_app_tcp_port`, in the [vars.yml](provisioning/vars.yml) file or 8088 is already in use on your host machine, the actual URL may be different._

Logs output by the VM can be viewed in a web browser at `http://127.0.0.1:19531/entries?_EXE=/usr/bin/node&follow`.

### Working With Docker ###

### Build

You can build a Docker container from your local own version of the codebase, FE:

- build: `docker build -t aharnum/first-discovery-server .`

### Run

Launching a working Dockerized version requires some prerequisites:
- a running Flow Manager to connect to (host name and port specified with the `GPII_OAUTH2_HOST_NAME` and `GPII_OAUTH2_TCP_PORT` environment variables)
- valid `GPII_OAUTH2_AUTH_CLIENT_ID` and `GPII_OAUTH2_AUTH_CLIENT_SECRET` values to be passed to the container at runtime as environment variables

#### Run Example

This is an example of launching a self-contained Flow Manager container, then connecting a First Discovery Server to it.

- launching Flow Manager:
```
docker run --name flowmanagerfd -d \
-e NODE_ENV=cloudBased.development.all.local \
-e PREFERENCES_SERVER_HOST_ADDRESS=localhost:8081 \
gpii/flow-manager
```

- launching First Discovery server, supplying the client ID and client secret as environment variables:
```
docker run -d -l flowmanagerfd -p 8088:8088 --name fdserver \
-e GPII_OAUTH2_HOST_NAME=http://flowmanagerfd \
-e GPII_OAUTH2_TCP_PORT=8081 \
-e GPII_OAUTH2_AUTH_CLIENT_ID={{ client_id }} \
-e GPII_OAUTH2_AUTH_CLIENT_SECRET={{ client_secret }} \
gpii/first-discovery-server
```

You should then be able to connect to http://{docker_host}:8088 /demos/prefsServerIntegration/ and go through the flow to receive a token (where docker_host is the IP of your locally-running Docker host), assuming your flow-manager container runs a version supporting the OAUTH code.

### Secrets ###

the `client_id` and `client_secret` are confidential and should not be committed.

#### Using Secrets With Vagrant ####

Vagrant is setup to be provisioned with environment variables from a "secrets.yml" file stored in the "provisioning" directory. "secrets.yml" is ignored by git and should not be added to versioning. An example is provided at "[secrets.yml.example](./provisioning/secrets.yml.example)" and takes the form:

```yaml
secrets_env_vars:
  - GPII_OAUTH2_AUTH_CLIENT_ID=first_discovery_client_id
  - GPII_OAUTH2_AUTH_CLIENT_SECRET=first_discovery_client_secret
```

#### Using Secrets With Docker ####

The needed secrets can be supplied to the Docker container at launch as environment variables with the *-e* flag; see the Docker section above for an example of how this works.

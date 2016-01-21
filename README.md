# GitNob
This is a simple github developed by Node.js

  [![Linux Build][travis-image]][travis-url]
  

[travis-image]: https://api.travis-ci.org/starlightslo/gitnob.svg
[travis-url]: https://travis-ci.org/starlightslo/gitnob


## Deploy succeeded on
* [AWS](https://aws.amazon.com/) Ubuntu 14.04 LTS
* [Linode](https://www.linode.com/) Ubuntu 14.04 LTS


## Requirements
* [NodeJs](http://nodejs.org)
* [Git](https://git-scm.com/)
* [npm](https://www.npmjs.com/)
* [Nginx](http://nginx.org/)


## Install latest version of NodeJs
```sh
$ sudo apt-get update
$ sudo apt-get install curl
$ curl --silent --location https://deb.nodesource.com/setup_4.x | sudo bash -
$ sudo apt-get install nodejs
```


## Install basic tools
```sh
$ sudo apt-get update
$ sudo apt-get install git nginx
```


## Setup the proxy of Nginx
```sh
$ sudo vim /etc/nginx/sites-available/default

server {
        listen 80 default_server;
        listen [::]:80 default_server ipv6only=on;

        # Make site accessible from http://localhost/
        server_name localhost;

        location / {
                proxy_pass http://127.0.0.1:8888;
        }
}
```

then

```sh
$ sudo service nginx restart
```


## Sudo permission
GitNob needs some commands with sudo permission, you need to change the **/etc/sudoers.d** file to add the commands without password.
For example, if you are running on **ubuntu** user:
```sh
$ sudo visudo

#
# This file MUST be edited with the 'visudo' command as root.
#
# Please consider adding local content in /etc/sudoers.d/ instead of
# directly modifying this file.
#
# See the man page for details on how to write a sudoers file.
#
Defaults        env_reset
Defaults        mail_badpass
Defaults        secure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

# Host alias specification

# User alias specification
User_Alias MY_USER = ubuntu

# Cmnd alias specification
Cmnd_Alias CMD_USERADD = /usr/sbin/useradd
Cmnd_Alias CMD_DELUSER = /usr/sbin/deluser
Cmnd_Alias CMD_GROUPADD = /usr/sbin/groupadd
Cmnd_Alias CMD_DELGROUP = /usr/sbin/delgroup
Cmnd_Alias CMD_USERMOD = /usr/sbin/usermod
Cmnd_Alias CMD_TOUCH = /usr/bin/touch
Cmnd_Alias CMD_FIND = /usr/bin/find
Cmnd_Alias CMD_MKDIR = /bin/mkdir
Cmnd_Alias CMD_CHOWN = /bin/chown
Cmnd_Alias CMD_CHMOD = /bin/chmod
Cmnd_Alias CMD_RM = /bin/rm
Cmnd_Alias CMD_GPASSWD = /usr/bin/gpasswd

# User privilege specification
root    ALL=(ALL:ALL) ALL
MY_USER ALL = NOPASSWD: CMD_USERADD
MY_USER ALL = NOPASSWD: CMD_DELUSER
MY_USER ALL = NOPASSWD: CMD_GROUPADD
MY_USER ALL = NOPASSWD: CMD_DELGROUP
MY_USER ALL = NOPASSWD: CMD_USERMOD
MY_USER ALL = NOPASSWD: CMD_TOUCH
MY_USER ALL = NOPASSWD: CMD_FIND
MY_USER ALL = NOPASSWD: CMD_MKDIR
MY_USER ALL = NOPASSWD: CMD_CHOWN
MY_USER ALL = NOPASSWD: CMD_CHMOD
MY_USER ALL = NOPASSWD: CMD_RM
MY_USER ALL = NOPASSWD: CMD_GPASSWD

# Members of the admin group may gain root privileges
%admin ALL=(ALL) ALL

# Allow members of group sudo to execute any command
%sudo   ALL=(ALL:ALL) ALL

# See sudoers(5) for more information on "#include" directives:

#includedir /etc/sudoers.d
```


## Configuration (config.js)
* **port**: GitNob will running on which port.
* **secret**: the secret of server.
* **gitPath**: the root path of git repository.
* **database**: 
  * **type**: only support txt now.
  * **path**: the path of database.
  * **name**: the name of database.
* **toggles**:
  * **userSignup**: allow user to signup.
* **logConfiguration**: the settings of log information.


## Install GitNob
```sh
$ git clone https://github.com/starlightslo/gitnob.git
$ cd gitnob
$ mkdir logs
$ npm install
```

then start GitNob

```sh
$ nodejs index.js
```

Then visit http://your_domain/

**Test domain**: http://gitnob.info/

**Admin account**: admin / admin


## Know Issues
* version 'GLIBCXX_3.4.20' not found
  ```sh
  $ sudo add-apt-repository ppa:ubuntu-toolchain-r/test
  $ sudo apt-get update
  $ sudo apt-get upgrade
  $ sudo apt-get dist-upgrade
  
  ```

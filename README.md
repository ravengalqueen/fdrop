# fdrop
An easy to set up cli tool to share files
---
# how to set up
## client
First we'll take you through the process of downloading and setting up the CLI tool
1. Download the fdrop-setup.sh file on the releases tab and run it as sudo (`sudo ./fdrop-setup.sh`)
2. run `fdrop -r` to create a new configuration file
3. run `fdrop -d <https://your.domain>` to add your domain to the config file
4. (optionally) modify the configuration file at $HOME/.config/fdrop/fdrop.conf
5. Your client installation was succesful!
## Server
The server part is a bit more complicated, but not impossible.
Now, I used sveltekit to manage routing and other stuff, so these steps will focus on sveltekit
if you want to help and add specific steps or modify the code to allow more framework compatibility, go ahead
Assumptions:
you have a server and access to its command line (e.g through ssh)
you have git, nodejs v20+, and npm installed on it
1. run `git clone https://github.com/ravengalqueen/fdrop.git`
2. move into the fdrop-server directory
3. run `npm install`
4. run `npm run build`
5. set up your preferred webserver software (e.g caddy, nginx, apache)
6. You're all done! You now have an easy way of sharing files

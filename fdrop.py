#!/usr/bin/env python3

import argparse
import configparser
import sys
import requests
import bcrypt
from pathlib import Path

CONFIG_FILE = Path.home() / ".config/fdrop/fdrop.conf"


def create_config():
    print(f"Creating configuration file at {CONFIG_FILE}")
    config = configparser.ConfigParser()
    config["Settings"] = {
        "allow_custom_lifetime": "true",
        "default_lifetime": "1",
        "max_file_size_mb": "256",
        "url": "https://your.domain"
    }
    CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
    save_config(config)


def load_config():
    config = configparser.ConfigParser()
    if CONFIG_FILE.exists():
        config.read(CONFIG_FILE)
    else:
        print("Configuration file not found. Creating a new one...")
        create_config()
        config.read(CONFIG_FILE)
    return config


def save_config(config):
    with open(CONFIG_FILE, "w") as configfile:
        config.write(configfile)
def parse_size(size, decimal_places=2):
    units = ['B', 'kB', 'MB', 'GB']
    for unit in units:
        if size < 1024:
            return f"{size:.{decimal_places}f} {unit}"
        size /= 1024
    return f"{size:.{decimal_places}f} PB"

def send_post_request(args, url, config):
    full_url = f"{url}/api/fdrop"
    filename = args.filename
    lifetime = args.lifetime if config["Settings"]["allow_custom_lifetime"] == "true" else config["Settings"]["default_lifetime"]
    password = args.password if args.password else None
    full_path = Path(filename).resolve()
    hashed_password = None
    print(f"Filename: {filename}")
    print(f"Size: {parse_size(full_path.stat().st_size)}")
    print(f"Lifetime: {lifetime} hours")
    if password:
        print(f"Password required: {password}")
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
       # print(f"hashed_pass: {hashed_password}")

    with open(full_path, 'rb') as f:
        files = {'file': (filename, f)}
        data = {'lifetime': lifetime, 'password': hashed_password, 'domain': url, 'maxSize': config["Settings"]["max_file_size_mb"]}

        headers = {'Origin': url}

        try:
            response = requests.post(full_url, files=files, data=data, headers=headers)
            response.raise_for_status()
            print("Success:", response.json().get("fileURL"))
        except requests.exceptions.RequestException as e:
            if hasattr(e, 'response'):
                print("Error:", e.response.status_code, e.response.text)
            else:
                print("Error:", str(e))
            sys.exit(1)


def main():
    config = load_config()
    parser = argparse.ArgumentParser(description="A file sharing cli written in Python.")
    parser.add_argument('filename', nargs='?', help="The file to share (required unless using -d or -r)")
    parser.add_argument('-l', '--lifetime', type=int, default=1,
                        help=f"The amount of time (in hours) the file should stay up, default: {config["Settings"]["default_lifetime"]} hour(s)")
    parser.add_argument('-p', '--password', help="If added, a password will be required for download")
    parser.add_argument('-d', '--domain', help="This will add your domain to the config file automatically")
    parser.add_argument('-t', '--temporary',
                        help="This will use a domain separate to the config one without touching the config file")
    parser.add_argument('-r', '--reset', action="store_true", help="This will reset your config file")

    args = parser.parse_args()

    if (not args.domain and not args.reset and not args.filename):
        parser.error("the following argument is required: filename")
    if (args.reset):
        create_config()
        print("Configuration file has been reset.")
        return

    if (args.domain):
        if ("Settings" not in config):
            print("Config file is invalid, recreating it...")
            create_config()
        config["Settings"]["url"] = args.domain
        save_config(config)
        print(f"Domain updated to {args.domain}")
        return
    if(args.lifetime and config["Settings"]["allow_custom_lifetime"] != "true"):
        parser.error("custom lifetimes are not allowed")

    if (args.filename):
        url = args.temporary if args.temporary else config["Settings"]["url"]
        send_post_request(args, url, config)


if __name__ == "__main__":
    main()

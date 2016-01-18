#!/bin/sh -e

ansible-playbook run.yml --tags "deploy"
supervisord -n -c /etc/supervisord.conf

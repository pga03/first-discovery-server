FROM inclusivedesign/nodejs:0.10.41

WORKDIR /etc/ansible/playbooks

COPY provisioning/*.yml /etc/ansible/playbooks/

ENV INSTALL_DIR=/opt/first-discovery-server

ENV UNIVERSAL_VARS_FILE=docker-vars.yml

RUN ansible-playbook playbook.yml --tags "install,configure"

COPY provisioning/start.sh /usr/local/bin/start.sh

RUN chmod 755 /usr/local/bin/start.sh

EXPOSE 8088

ENTRYPOINT ["/usr/local/bin/start.sh"]
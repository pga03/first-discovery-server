FROM inclusivedesign/nodejs:4.2.4

WORKDIR /etc/ansible/playbooks

COPY provisioning/* /etc/ansible/playbooks/

# We don't need to do this for this Dockerfile since the roles are already
# installed in the parent nodejs container
# RUN ansible-galaxy install -r requirements.yml

ENV INSTALL_DIR=/opt/first-discovery-server

COPY . $INSTALL_DIR

RUN ansible-playbook docker.yml --tags "install,configure"

COPY provisioning/start.sh /usr/local/bin/start.sh

RUN chmod 755 /usr/local/bin/start.sh

EXPOSE 8088

ENTRYPOINT ["/usr/local/bin/start.sh"]

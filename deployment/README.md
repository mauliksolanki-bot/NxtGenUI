# Deploy NxtGenUI to Azure Ubuntu

The pipeline builds the `development` branch of the NxtGenUI Azure Repos repository and deploys static files to `172.198.161.188`.

## 1. Prepare the Ubuntu VM once

Copy the `deployment` folder to the VM, sign in with your Ubuntu account, and run:

```bash
sudo bash deployment/bootstrap-ubuntu.sh YOUR_UBUNTU_USERNAME
```

Enter your sudo password when prompted. This installs Nginx and creates `/opt/nxtgen` owned by your deployment account. Existing unrelated Nginx sites are left in place. If you already have a site using the same IP as its server name, resolve that conflict before running setup.

The backend is assumed to run on this VM at `http://127.0.0.1:8080`. To use a different backend, pass it as the third argument:

```bash
sudo bash deployment/bootstrap-ubuntu.sh YOUR_UBUNTU_USERNAME 172.198.161.188 http://BACKEND_HOST:8080
```

This pipeline deploys the frontend only. The backend must be deployed and running separately.

Allow inbound TCP 22 for the pipeline agent and TCP 80 for website users in the Azure network security group and Ubuntu firewall, if enabled. Use a self-hosted agent with a fixed address if SSH access is restricted to fixed IPs. Do not expose backend port 8080 publicly for this setup.

## 2. Enter SSH credentials in Azure DevOps

In project **NxtGen**, open **Project settings → Service connections → New service connection → SSH**:

| Setting | Value |
| --- | --- |
| Connection name | `nxtgen-ubuntu-ssh` |
| Host | `172.198.161.188` |
| Port | `22` |
| Username | Your Ubuntu username |
| Password | Your Ubuntu SSH password |

Authorize this service connection for this pipeline. If your VM uses SSH keys instead of password authentication, enter the private key and passphrase in the connection. The VM's existing authentication configuration determines which method works.

Username and password belong in the service connection rather than the committed YAML. The YAML's `sshServiceConnection` variable points to this connection; update the name there if you choose a different one.

## 3. Create and run the pipeline

Commit `azure-pipelines.yml` and the `deployment` folder to the `development` branch of:

`https://dev.azure.com/mauliksolanki-bot/NxtGen/_git/NxtGenUI`

In **Pipelines → New pipeline**, choose **Azure Repos Git → NxtGenUI → Existing Azure Pipelines YAML file**, branch **development**, and path **/azure-pipelines.yml**. Save and run.

Pushes to `development` build and deploy automatically. Deployment is skipped for other branches and pull-request runs. Azure Repos PR validation uses a branch-policy build-validation rule; YAML `pr` triggers apply to other supported Git providers.

Open `http://172.198.161.188` after deployment. The pipeline checks that Nginx serves the deployed `index.html`; this check does not verify backend availability.

## Server files and rollback

```text
/opt/nxtgen/
  releases/<build-id>/dist/       Built UI files
  releases/<build-id>/activate-release.sh
  current -> releases/<build-id>  Active release
  .deployment.lock
```

Releases are retained. If the website check fails, the pipeline restores the previous symlink. To manually activate a previous build:

```bash
bash /opt/nxtgen/releases/BUILD_ID/activate-release.sh /opt/nxtgen BUILD_ID 172.198.161.188
```

Nginx configuration is `/etc/nginx/sites-available/nxtgen`. Restarting Nginx is unnecessary for deployments because its document root uses the `current` symlink.

This initial setup serves HTTP on port 80. Configure a domain and HTTPS certificate before using credentials over a public connection.

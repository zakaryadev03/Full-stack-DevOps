#!/bin/bash
set -x

# --- Configuration ---
# 1. Create a GitHub Personal Access Token (PAT) with "repo" scope.
# 2. In your CI/CD pipeline (GitHub Actions, Azure DevOps, etc.), create a
#    secret variable named GITHUB_TOKEN and paste your PAT value into it.
# 3. Update the REPO_URL line to point to your repo, using the $GITHUB_TOKEN.

REPO_URL="https://zakaryadev03:${GITHUB_TOKEN}@github.com/zakaryadev03/Full-stack-DevOps.git"
MANIFEST_PATH="k8s" # The folder in your repo containing the manifests
TMP_REPO_PATH="/tmp/temp_repo"

# Git bot configuration
GIT_USER_NAME="Azure DevOps CI"
GIT_USER_EMAIL="ci-bot@dev.azure.com"

# --- Argument Validation ---
if [ "$#" -ne 3 ]; then
    echo "ERROR: Illegal number of parameters."
    echo "Usage: $0 <service-name> <docker-image-name> <image-tag>"
    echo "Example: $0 api-gateway zakaryab2003/fsdevopsapi v1.0.1"
    exit 1
fi

# Assign arguments to readable variables
SERVICE_NAME="$1" # e.g., "api-gateway"
IMAGE_NAME="$2"   # e.g., "zakaryab2003/fsdevopsapi" (your Docker Hub image)
IMAGE_TAG="$3"    # e.g., "latest" or "v1.0.1" or $CI_COMMIT_SHA

# Define the full path to the manifest file
MANIFEST_FILE="$MANIFEST_PATH/$SERVICE_NAME-deployment.yaml"

# --- Git Operations ---

# Cleanup previous runs just in case
rm -rf "$TMP_REPO_PATH"

# Clone the git repository
# We add --depth 1 for a shallow clone, which is faster for CI
git clone --depth 1 "$REPO_URL" "$TMP_REPO_PATH"
cd "$TMP_REPO_PATH"

# Configure Git user for this commit
git config user.name "$GIT_USER_NAME"
git config user.email "$GIT_USER_EMAIL"

# --- Manifest Update ---

# Check if the file exists before trying to modify it
if [ ! -f "$MANIFEST_FILE" ]; then
    echo "ERROR: Manifest file not found at $MANIFEST_FILE"
    exit 1
fi

# Make changes to the Kubernetes manifest file
# This sed command finds the line starting with "image:" and replaces
# the entire value with your new Docker Hub image and tag.
# The '|' is used as a delimiter instead of '/' to avoid conflicts with
# the '/' in the image name.
echo "Updating $MANIFEST_FILE to use image $IMAGE_NAME:$IMAGE_TAG"
sed -i "s|image: .*|image: $IMAGE_NAME:$IMAGE_TAG|g" "$MANIFEST_FILE"

# --- Git Commit & Push ---

# Add only the modified file
git add "$MANIFEST_FILE"

# Commit the changes with a specific message
git commit -m "CI: Update $SERVICE_NAME image to $IMAGE_NAME:$IMAGE_TAG"

# Push the changes back to the repository (to the main/master branch)
git push

# Cleanup: remove the temporary directory
echo "Successfully pushed manifest update. Cleaning up."
rm -rf "$TMP_REPO_PATH"
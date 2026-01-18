import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand('logicapp-scaffolder.createProject', async () => {
    // Prompt for resource group name
    const resourceGroupName = await vscode.window.showInputBox({
      prompt: 'Enter Resource Group Name',
      placeHolder: 'rg-emd-ae-prd',
      validateInput: (value) => {
        return value && value.trim() ? null : 'Resource group name is required';
      }
    });

    if (!resourceGroupName) {
      return;
    }

    // Prompt Project name
    const projectName = await vscode.window.showInputBox({
      prompt: 'Enter Project Name',
      placeHolder: 'order-processing',
      validateInput: (value) => {
        return value && value.trim() ? null : 'Project name is required';
      }
    });

    if (!projectName) {
      return;
    }

    // Prompt Project name
    const orgName = await vscode.window.showInputBox({
      prompt: 'Enter Org Name (3 Letter)',
      placeHolder: 'emd',
      validateInput: (value) => {
        return value && value.trim() ? null : 'Organization name is required';
      }
    });

    if (!orgName) {
      return;
    }

    // Prompt for DevOps Service Connection Name
    const devOpsServiceConnectionName = await vscode.window.showInputBox({
      prompt: 'Enter DevOps Service Connection Name',
      placeHolder: 'PROD DEVOPS DEPLOYMENT',
      validateInput: (value) => {
        return value && value.trim() ? null : 'DevOps Service Connection  name is required';
      }
    });

    if (!devOpsServiceConnectionName) {
      return;
    }

    // Get workspace folder
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('Please open a workspace folder first');
      return;
    }

    const rootPath = workspaceFolder.uri.fsPath;

    try {
      // Create folder structure
      createFolder(rootPath, 'src/deploy');
      createFolder(rootPath, 'src/deploy/artifacts');
      createFolder(rootPath, 'src/deploy/env');
      createFolder(rootPath, 'workflows');
      createFolder(rootPath, 'src/logicapps');
      createFolder(rootPath, 'src/functionapps');
      createFolder(rootPath, 'src/bicep/modules');

      //Create Bicep Parameter Files
      fs.writeFileSync(path.join(rootPath, 'src/deploy/env/main.dev.bicepparam'), '{}');
      fs.writeFileSync(path.join(rootPath, 'src/deploy/env/main.sit.bicepparam'), '{}');
      fs.writeFileSync(path.join(rootPath, 'src/deploy/env/main.uat.bicepparam'), '{}');
      fs.writeFileSync(path.join(rootPath, 'src/deploy/env/main.prd.bicepparam'), '{}');
      // Create Bicep file
      createBicepFile(rootPath, orgName, projectName);

      // Create Azure DevOps Pipeline YAML
      createPipelineYaml(rootPath, resourceGroupName, devOpsServiceConnectionName, 'australiaeast');

      // Create sample Logic App workflow
      createSampleLogicApp(rootPath);

      // Create sample Function App
      createSampleFunctionApp(rootPath);

      vscode.window.showInformationMessage('Logic App Standard project created successfully!');
    } catch (error) {
      vscode.window.showErrorMessage(`Error creating project: ${error}`);
    }
  });

  context.subscriptions.push(disposable);
}

function createFolder(rootPath: string, folderPath: string) {
  const fullPath = path.join(rootPath, folderPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
}

function createBicepFile(rootPath: string, orgName: string, projectName: string) {
  const bicepContent = `// Logic App Standard Infrastructure
param location string = resourceGroup().location
var logicAppName = toLower('logic-${projectName}-prd-ae}')
var appServicePlanName = toLower('asp-${orgName}-prd-ae-001}')
var storageAccountName = toLower('st\${orgName}prdae001')
var keyvaultName = toLower('kv-${orgName}-prd-ae-001')
var omsWorkspaceName = toLower('oms-${orgName}-prd-ae-001')
var actionGroupName = toLower('ag-${orgName}-prd-ae-001')

// Storage Account for Logic App
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
  }
}

// App Service Plan
resource appServicePlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: appServicePlanName
  location: location
  sku: {
    name: 'WS1'
    tier: 'WorkflowStandard'
  }
  kind: 'elastic'
}

// Logic App (Standard)
resource logicApp 'Microsoft.Web/sites@2023-01-01' = {
  name: logicAppName
  location: location
  kind: 'functionapp,workflowapp'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      appSettings: [
        {
          name: 'APP_KIND'
          value: 'workflowApp'
        }
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=\${storageAccount.name};AccountKey=\${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=\${storageAccount.name};AccountKey=\${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
        }
        {
          name: 'WEBSITE_CONTENTSHARE'
          value: toLower(logicAppName)
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~18'
        }
      ]
      netFrameworkVersion: 'v6.0'
      use32BitWorkerProcess: false
    }
    httpsOnly: true
  }
}

// Function App
resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=\${storageAccount.name};AccountKey=\${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=\${storageAccount.name};AccountKey=\${storageAccount.listKeys().keys[0].value};EndpointSuffix=core.windows.net'
        }
        {
          name: 'WEBSITE_CONTENTSHARE'
          value: toLower(functionAppName)
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
      ]
    }
    httpsOnly: true
  }
}

output logicAppName string = logicApp.name
output storageAccountName string = storageAccount.name
`;

  const bicepPath = path.join(rootPath, 'src/deploy/main.bicep');
  fs.writeFileSync(bicepPath, bicepContent);

  fs.writeFileSync(path.join(rootPath, 'src/deploy/integration.bicep'), '{}');
  fs.writeFileSync(path.join(rootPath, 'src/deploy/monitoring.bicep'), '{}');
}

function createPipelineYaml(rootPath: string, resourceGroupName: string, serviceConnectionName: string, location: string) {
  const yamlContent = `trigger:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  azureSubscription: '${serviceConnectionName}'
  resourceGroupName: '${resourceGroupName}'
  location: '${location}'
  bicepFile: 'src/deploy/main.bicep'

stages:
  - stage: Build
    displayName: 'Build Stage'
    jobs:
      - job: BuildJob
        displayName: 'Build Artifacts'
        steps:
          - task: CopyFiles@2
            displayName: 'Copy Bicep Files'
            inputs:
              SourceFolder: 'src/deploy'
              Contents: '**/*.bicep'
              TargetFolder: '$(Build.ArtifactStagingDirectory)/bicep'

          - task: CopyFiles@2
            displayName: 'Copy Logic Apps'
            inputs:
              SourceFolder: 'src/logicapps'
              Contents: '**'
              TargetFolder: '$(Build.ArtifactStagingDirectory)/logicapps'

          - task: CopyFiles@2
            displayName: 'Copy Function Apps'
            inputs:
              SourceFolder: 'src/functionapps'
              Contents: '**'
              TargetFolder: '$(Build.ArtifactStagingDirectory)/functionapps'

          - task: PublishBuildArtifacts@1
            displayName: 'Publish Artifacts'
            inputs:
              PathtoPublish: '$(Build.ArtifactStagingDirectory)'
              ArtifactName: 'drop'

  - stage: Deploy
    displayName: 'Deploy Stage'
    dependsOn: Build
    jobs:
      - deployment: DeployInfrastructure
        displayName: 'Deploy Infrastructure'
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: DownloadBuildArtifacts@1
                  inputs:
                    buildType: 'current'
                    downloadType: 'single'
                    artifactName: 'drop'
                    downloadPath: '$(System.ArtifactsDirectory)'

                - task: AzureCLI@2
                  displayName: 'Deploy Bicep Template'
                  inputs:
                    azureSubscription: '$(azureSubscription)'
                    scriptType: 'bash'
                    scriptLocation: 'inlineScript'
                    inlineScript: |
                      az group create --name $(resourceGroupName) --location $(location)
                      az deployment group create \\
                        --resource-group $(resourceGroupName) \\
                        --template-file $(System.ArtifactsDirectory)/drop/bicep/main.bicep \\
                        --parameters location=$(location)

                - task: AzureCLI@2
                  displayName: 'Get Logic App Name'
                  inputs:
                    azureSubscription: '$(azureSubscription)'
                    scriptType: 'bash'
                    scriptLocation: 'inlineScript'
                    inlineScript: |
                      logicAppName=$(az deployment group show \\
                        --resource-group $(resourceGroupName) \\
                        --name main \\
                        --query properties.outputs.logicAppName.value -o tsv)
                      echo "##vso[task.setvariable variable=logicAppName]$logicAppName"
                      
                      functionAppName=$(az deployment group show \\
                        --resource-group $(resourceGroupName) \\
                        --name main \\
                        --query properties.outputs.functionAppName.value -o tsv)
                      echo "##vso[task.setvariable variable=functionAppName]$functionAppName"

                - task: AzureFunctionApp@2
                  displayName: 'Deploy Logic App Workflows'
                  inputs:
                    azureSubscription: '$(azureSubscription)'
                    appType: 'functionApp'
                    appName: '$(logicAppName)'
                    package: '$(System.ArtifactsDirectory)/drop/logicapps'
                    deploymentMethod: 'zipDeploy'

                - task: AzureFunctionApp@2
                  displayName: 'Deploy Function App'
                  inputs:
                    azureSubscription: '$(azureSubscription)'
                    appType: 'functionApp'
                    appName: '$(functionAppName)'
                    package: '$(System.ArtifactsDirectory)/drop/functionapps'
                    deploymentMethod: 'zipDeploy'
`;

  const yamlPath = path.join(rootPath, 'workflows/azure-pipeline.yml');
  fs.writeFileSync(yamlPath, yamlContent);
}

function createSampleLogicApp(rootPath: string) {
  const workflowContent = `{
  "definition": {
    "$schema": "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
    "actions": {
      "Response": {
        "type": "Response",
        "kind": "http",
        "inputs": {
          "statusCode": 200,
          "body": {
            "message": "Hello from Logic App Standard!"
          }
        },
        "runAfter": {}
      }
    },
    "triggers": {
      "manual": {
        "type": "Request",
        "kind": "Http",
        "inputs": {
          "schema": {}
        }
      }
    },
    "contentVersion": "1.0.0.0",
    "outputs": {}
  },
  "kind": "Stateful"
}`;

  const hostContent = `{
  "version": "2.0",
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle.Workflows",
    "version": "[1.*, 2.0.0)"
  }
}`;

  createFolder(rootPath, 'src/logicapps/SampleWorkflow');
  createFolder(rootPath, 'src/logicapps/SampleWorkflow/Artifacts');
  fs.writeFileSync(path.join(rootPath, 'src/logicapps/SampleWorkflow/workflow.json'), workflowContent);
  fs.writeFileSync(path.join(rootPath, 'src/logicapps/host.json'), hostContent);
  fs.writeFileSync(path.join(rootPath, 'src/logicapps/connections.json'), '{}');
  fs.writeFileSync(path.join(rootPath, 'src/logicapps/parameters.json'), '{}');
}

function createSampleFunctionApp(rootPath: string) {
  const functionContent = `const { app } = require('@azure/functions');

app.http('HttpTrigger', {
    methods: ['GET', 'POST'],
    authLevel: 'function',
    handler: async (request, context) => {
        context.log('HTTP trigger function processed a request.');
        
        const name = request.query.get('name') || await request.text() || 'World';
        
        return { 
            status: 200,
            body: \`Hello, \${name}!\`
        };
    }
});`;

  const hostContent = `{
  "version": "2.0",
  "logging": {
    "applicationInsights": {
      "samplingSettings": {
        "isEnabled": true,
        "maxTelemetryItemsPerSecond": 20
      }
    }
  },
  "extensionBundle": {
    "id": "Microsoft.Azure.Functions.ExtensionBundle",
    "version": "[4.*, 5.0.0)"
  }
}`;

  const packageJson = `{
  "name": "functionapp",
  "version": "1.0.0",
  "description": "Azure Function App",
  "scripts": {
    "start": "func start"
  },
  "dependencies": {
    "@azure/functions": "^4.0.0"
  }
}`;

  createFolder(rootPath, 'src/functionapps/HttpTrigger');
  fs.writeFileSync(path.join(rootPath, 'src/functionapps/HttpTrigger/index.js'), functionContent);
  fs.writeFileSync(path.join(rootPath, 'src/functionapps/host.json'), hostContent);
  fs.writeFileSync(path.join(rootPath, 'src/functionapps/package.json'), packageJson);
}

export function deactivate() { }
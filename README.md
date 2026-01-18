# Logic App Standard Scaffolder

A Visual Studio Code extension that quickly scaffolds Azure Logic App Standard projects with Bicep infrastructure-as-code and Azure DevOps CI/CD pipelines.

## Features

- 🚀 **Quick Project Setup**: Create a complete Logic App Standard project structure in seconds
- 🏗️ **Infrastructure as Code**: Auto-generates Bicep templates for Azure resources
- 🔄 **CI/CD Ready**: Includes Azure DevOps pipeline YAML for automated deployments
- 📦 **Complete Structure**: Sets up Logic Apps, Function Apps, and all required configurations
- ⚡ **Sample Code Included**: Comes with working examples to get you started immediately

## What Gets Created

When you run this extension, it creates the following structure:

```
your-project/
├── src/
│   ├── deploy/
│   │   └── main.bicep              # Infrastructure as Code (Bicep)
│   ├── logicapps/
│   │   ├── host.json
│   │   └── SampleWorkflow/
│   │       └── workflow.json       # Sample HTTP trigger workflow
│   
└── workflows/
    └── azure-pipeline.yml          # Azure DevOps CI/CD pipeline
```

### Generated Resources

The Bicep template (`src/deploy/main.bicep`) provisions:

- **Logic App Standard** (Workflow App)
- **Azure Function App**
- **App Service Plan** (WorkflowStandard tier)
- **Storage Account** (for Logic App and Function App state)

The pipeline (`workflows/azure-pipeline.yml`) includes:

- Build stage with artifact creation
- Deploy stage with infrastructure deployment
- Automated deployment of Logic App workflows
- Automated deployment of Function Apps

## Installation

### From Marketplace (Coming Soon)

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search for "Logic App Standard Scaffolder"
4. Click Install

### From VSIX

1. Download the `.vsix` file from releases
2. Open VS Code
3. Go to Extensions
4. Click the `...` menu → "Install from VSIX"
5. Select the downloaded `.vsix` file

### From Source

```bash
git clone https://github.com/yourusername/logicapp-scaffolder.git
cd logicapp-scaffolder
npm install
npm run compile
```

Press `F5` to run in debug mode.

## Usage

1. Open VS Code
2. Open a folder where you want to create your Logic App project
3. Open the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
4. Type and select: **"Create Logic App Standard Project"**
5. Enter your Azure Resource Group name when prompted
6. The extension will create all files and folders

![Demo](https://via.placeholder.com/800x450.png?text=Demo+Screenshot)

## Prerequisites

To deploy the generated project, you'll need:

- Azure subscription
- Azure CLI installed
- Azure DevOps project (for CI/CD pipeline)
- Service connection configured in Azure DevOps

## Customization

### Bicep Template

Edit `src/deploy/main.bicep` to:
- Change SKU/pricing tiers
- Add additional Azure resources
- Modify resource naming conventions
- Add tags or custom configurations

### Pipeline

Edit `workflows/azure-pipeline.yml` to:
- Update the `azureSubscription` variable with your service connection name
- Change the `location` variable for your preferred region
- Add additional deployment stages or environments
- Customize build and deployment steps

### Logic App Workflows

The sample workflow in `src/logicapps/SampleWorkflow/` is a simple HTTP trigger. Replace or extend it with:
- Your custom workflow definitions
- Connections to other services
- Parameters and configurations

## Deployment

### Manual Deployment

```bash
# Login to Azure
az login

# Create resource group
az group create --name <resource-group-name> --location eastus

# Deploy Bicep template
az deployment group create \
  --resource-group <resource-group-name> \
  --template-file src/deploy/main.bicep

# Deploy Logic App workflows
az functionapp deployment source config-zip \
  --resource-group <resource-group-name> \
  --name <logic-app-name> \
  --src <path-to-logicapps.zip>
```

### CI/CD Deployment

1. Push your code to Azure Repos or GitHub
2. Create a pipeline using `workflows/azure-pipeline.yml`
3. Update the `azureSubscription` variable with your service connection
4. Run the pipeline

## Requirements

- VS Code version 1.85.0 or higher
- Node.js 18.x or higher (for Function Apps)
- Azure CLI (for deployments)

## Extension Settings

This extension contributes the following command:

- `logicapp-scaffolder.createProject`: Create Logic App Standard Project

## Known Issues

- None currently reported

## Release Notes

### 1.0.0

Initial release:
- Project scaffolding for Logic App Standard
- Bicep template generation
- Azure DevOps pipeline generation
- Sample Logic App workflow
- Sample Function App

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 🐛 [Report Issues](https://github.com/yourusername/logicapp-scaffolder/issues)
- 💡 [Request Features](https://github.com/yourusername/logicapp-scaffolder/issues)
- 📧 Contact: your.email@example.com

## Resources

- [Azure Logic Apps Documentation](https://docs.microsoft.com/azure/logic-apps/)
- [Bicep Documentation](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)
- [Azure DevOps Documentation](https://docs.microsoft.com/azure/devops/)

---

**Enjoy scaffolding your Logic App projects! 🚀**
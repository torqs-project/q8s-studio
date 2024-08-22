# Qubernetes Studio (q8s-studio)
This is a simple GUI app for facilitating Kubernetes cluster running and management. 

## Features
- Create and manage Kubernetes kluster configurations
- Run saved configurations easily
- Get information of the running container in app
- Open running Jupyter Lab in your browser with a click

## Contributing
If you find a bug or have a feature idea that is not listed on GitHub issues, please file one. 
On small solutions, file a pull request. For larger changes, please contact the developers (vstirbu@gmail.com) directly or open an issue for discussion on github.

### Starting Development

[Electron React Boilerplate template](https://github.com/electron-react-boilerplate/electron-react-boilerplate
) have been used to get started in the project. For detailed instructions on how to use the template, please refer to their [README](https://github.com/electron-react-boilerplate/electron-react-boilerplate/) .



Clone this repository and navigate to the directory
```bash
git clone https://github.com/torqs-project/q8s-studio.git

cd q8s-studio
```

Install dependencies:
```bash
npm install
```

Start the app in the `dev` environment:
```bash
npm start
```

### Packaging for Production

To package apps for the local platform:

```bash 
npm run package
```


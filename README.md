# BioDrive

## Description

Bio Drive is a website that hosts <a href="http://neb.ist.utl.pt/~neb.daemon/site/">NEBIST's</a> repository.

It provides digital access to several study materials to the <a href="https://tecnico.ulisboa.pt/pt/ensino/cursos/licenciaturas/engenharia-biologica/">Biological Engineering</a> students from <a href="https://tecnico.ulisboa.pt/pt/">Instituto Superior Técnico</a>, thus contributing to their academic success.

<br>

## How does it work:

Every week, a workflow defined here [.github/workflows/update.yml](.github/workflows/update.yml) is triggered. This workflow
runs the script [./src/files/generateFiles.js](./src/files/generateFiles.js) (see [Section](generate-files-functionality) for more details) so as to generate/update the files containing all
the NEBIST Google Drive file's metadata. These files are what make all the website functionality, e.g., directory navigation, and file download, work.

Our server implements Fenix authentication as described in the [Fenix API documentation](https://fenixedu.org/dev/tutorials/use-fenixedu-api-in-your-application/).
After a user successfully authenticates, the server generates a JWT (JSON Web Token) and securely sends it to the client as an HTTP-only cookie.
This cookie is used to maintain the user's authenticated state.
When a subsequent request is made, the server reads and validates the JWT to verify the user's identity and ensure the session is still valid.

<br>

### Generate Files Functionality:

As mentioned earlier this file retrieves the NEBIST Google Drive file metadata to generate two JSON files.
It does so by using a Google Drive API Secret.

After that, it queries the Google Drive API starting by the two root folders (the archive and new drive) with the IDS defined in the variable `ROOT_IDS`.

<br>

## Development

### To test the website locally:

1. Start by cloning this repo

```
git clone https://github.com/guilhas07/bio-drive.git
```

2. Install `Node 22`

3. Copy the file [example.env](./example.env) to a file called `.env`. Here you will replace the following keys:

```bash
FENIX_API='YOUR_FENIX_CLIENT_KEY'
FENIX_SECRET='YOUR_FENIX_SECRET_KEY'
REDIRECT_URI='YOUR_REDIRECT_URI'
```

by your newly created keys. Before creating your `fake` application so you can have the keys, by following https://fenixedu.org/dev/tutorials/use-fenixedu-api-in-your-application/ check
the expected format:

```bash
FENIX_API='5790153********'
FENIX_SECRET='qlXJR0***********************************************************************************'
REDIRECT_URI='http://localhost:3000/login/redirect'
```

> [!WARNING]
> The REDIRECT_URI should be the same!

4. To run the server you first need to install the required packages. If you already installed `Node`, you can simply run the command:

```
npm i
```

5. Now start the server in dev mode, which means the server will restart every time you make changes:

```
npm run dev
```

And you should be able to access the website at http://localhost:3000.

### Test the GoogleDrive JSON file generation locally:

1. Follow the steps 1-4 in the previous [Section](#to-test-the-website-locally).
2. Run the script:

```
npm run update
```

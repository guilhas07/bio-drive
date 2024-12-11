require("dotenv").config();
const { google } = require("googleapis");
const fs = require("fs");

// Global Constants
const API_KEYS = [process.env.GOOGLE_API];
const ROOT_IDS = [process.env.GOOGLE_FOLDER_ID];
const FILES = ["./src/files/files.json"];

/**
 * Generate files for provided drives.
 */
(async function () {
    for (let i = 0; i < FILES.length; i++) {
        drive = google.drive({ version: "v3", auth: API_KEYS[i] });
        let json = { id: ROOT_IDS[i] };
        await appendFolders(json);
        fs.writeFile(`${FILES[i]}`, JSON.stringify(json, null, "\t"), (err) => {
            if (err) {
                console.log(err);
                return;
            }
            console.log(`File saved on ${FILES[i]}`);
        });
    }
})();

/**
 * Recursive function to add folders and files to json
 */
async function appendFolders(json) {
    let id = json.id,
        next_page,
        response,
        num_tries = 0,
        retry = false;

    do {
        try {
            response = await drive.files.list({
                q: `'${id}' in parents`,
                pageToken: next_page,
                orderBy: `folder,name`,
            });
        } catch (err) {
            if (err.code != "403") {
                console.log(`Error: ${err.message}`);
                return;
            }
            await new Promise((resolve) =>
                setTimeout(resolve, 2 ** num_tries * Math.random() * 1000)
            );
            num_tries++;
            retry = true;
            continue;
        }
        next_page = response.data.nextPageToken;
        retry = false;
    } while (retry || next_page != null);

    Object.entries(response.data.files).forEach(([, v]) => {
        if (v.mimeType === "application/vnd.google-apps.folder")
            json[v.name] = { id: v.id };
        else {
            if (json["files"] == null) json["files"] = [];
            json["files"].push({ name: v.name, id: v.id });
        }
    });

    // create a promises array so we can wait for all before moving
    // on to same level folder
    const promisesToAwait = [];
    for (let i in json)
        if (i !== "files" && i !== "id")
            promisesToAwait.push(appendFolders(json[i]));
    await Promise.all(promisesToAwait);
}

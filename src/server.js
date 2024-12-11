/**
 * @typedef {import('express').Request & { isAuthUser?: boolean, filesData?: any|any[], myPath?: any }} AuthenticatedRequest
 */

// Generate a 256-bit secret (32 bytes)
const SECRET = require("crypto").randomBytes(32);

require("dotenv").config();
const jose = require("jose");
const ALG = "HS256";
const express = require("express");
const cookieParser = require("cookie-parser");
const files = require("./files/files.json");

/**
 * @param {any} variable
 * @param {string} errMsg
 * @returns {string}
 */
function assertString(variable, errMsg) {
    if (typeof variable !== "string") {
        throw new Error(errMsg);
    }
    return variable;
}
const CLIENT_ID = assertString(
    process.env.FENIX_API,
    "Fenix API KEY should be a string."
);
const CLIENT_SECRET = assertString(
    process.env.FENIX_SECRET,
    "Fenix SECRET should be a string."
);
const REDIRECT_URI = assertString(
    process.env.REDIRECT_URI,
    "REDIRECT_URI should be a string."
);
const isProduction = process.env.NODE_ENV !== "dev";
const COOKIE_NAME = "auth";

async function getJWT() {
    return await new jose.SignJWT()
        .setProtectedHeader({ alg: ALG })
        .setExpirationTime("365days")
        .sign(SECRET);
}

/**
 * @param {any} cookie
 */
async function isJWTValid(cookie) {
    try {
        await jose.jwtVerify(cookie, SECRET);
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * Middleware to check if a user is authenticated.
 * @param {AuthenticatedRequest} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function isAuth(req, res, next) {
    req.isAuthUser = await isJWTValid(req.cookies[COOKIE_NAME]);
    next();
}

/**
 * Middleware to require a authenticated user
 * @param {AuthenticatedRequest} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
async function requireAuth(req, res, next) {
    if (!req.isAuthUser) {
        return res.redirect("/login");
    }
    return next();
}

const app = express();

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static("public"));
app.use(cookieParser());
app.use(isAuth);
app.listen(3000, () => {
    console.log("Listening on port 3000");
});

/**
 * @param {any} files
 */
function getFilesData(files) {
    /**
     * The actual middleware function.
     * @param {AuthenticatedRequest} req - The request object.
     * @param {import('express').Response} res - The response object.
     * @param {import('express').NextFunction} next - The next function to call.
     */
    return (req, res, next) => {
        /** @type {any} */
        const begin = [];

        if (req.params[0] === "") {
            req.myPath = begin;
            req.filesData = null;
            return next();
        }

        let files_copy = files;
        const path = req.params[0].slice(0, -1).split("/");

        for (let i of path) {
            // Handle non-existing path
            if (files_copy[i] === undefined) {
                res.status(404).send("Not found.");
                return next();
            }
            files_copy = files_copy[i];
        }

        begin.push(...path);
        req.myPath = begin;
        req.filesData = files_copy;
        next();
    };
}

app.get("/login", (req, res) => {
    const queryParams = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
    });
    res.redirect(
        `https://fenix.tecnico.ulisboa.pt/oauth/userdialog?${queryParams}`
    );
});

app.get("/logout", (req, res) => {
    res.clearCookie(COOKIE_NAME);
    res.redirect(`/`);
});

app.get("/login/redirect", async (req, res) => {
    const code = assertString(
        req.query.code,
        "Fenix API should always return a valid string 'code'."
    );
    const queryParams = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        code: code,
        grant_type: "authorization_code",
    });

    const VALIDATE_CODE = `https://fenix.tecnico.ulisboa.pt/oauth/access_token?${queryParams}`;
    const r = await fetch(VALIDATE_CODE, { method: "POST" });

    if (r.status === 200) {
        res.cookie(COOKIE_NAME, await getJWT(), {
            httpOnly: true,
            secure: isProduction,
            sameSite: "strict",
            maxAge: 365 * 24 * 3600 * 1000,
        });
        res.redirect("/");
        return;
    }
    res.redirect("/login");
});

app.get(
    "/drive/*",
    requireAuth,
    getFilesData(files),
    /**
     * The actual middleware function.
     * @param {AuthenticatedRequest} req - The request object.
     * @param {import('express').Response} res - The response object.
     */
    (req, res) => {
        res.render("drive", {
            user: req.isAuthUser,
            path: req.myPath,
            data: req.filesData,
        });
    }
);

app.get(
    "/",

    /**
     * The actual middleware function.
     * @param {AuthenticatedRequest} req - The request object.
     * @param {import('express').Response} res - The response object.
     */
    (req, res) => {
        res.render("index", { user: req.isAuthUser });
    }
);

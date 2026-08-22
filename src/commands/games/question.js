const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "../../../data");
const sqliteFile = path.join(dataDir, "questions.sqlite");
const jsonFile = path.join(dataDir, "questions.json");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(sqliteFile);

db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
        guildId TEXT PRIMARY KEY,
        channel TEXT,
        title TEXT,
        description TEXT,
        answers TEXT,
        correct TEXT,
        answered TEXT
    );
`);

function migrateJson() {
    if (!fs.existsSync(jsonFile)) return;

    try {
        const data = JSON.parse(
            fs.readFileSync(jsonFile, "utf8")
        );

        const count = db.prepare(
            "SELECT COUNT(*) as count FROM questions"
        ).get().count;

        if (count > 0) return;

        const insert = db.prepare(`
            INSERT INTO questions (
                guildId,
                channel,
                title,
                description,
                answers,
                correct,
                answered
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const transaction = db.transaction(() => {

            for (const guildId in data) {

                const q = data[guildId];

                insert.run(
                    guildId,
                    q.channel ?? null,
                    q.title ?? null,
                    q.description ?? null,
                    JSON.stringify(q.answers ?? []),
                    q.correct ?? null,
                    JSON.stringify(q.answered ?? [])
                );
            }

        });

        transaction();

        fs.renameSync(
            jsonFile,
            jsonFile + ".backup"
        );

        console.log("[QUESTION] Migration questions.json -> SQLite terminée");

    } catch (err) {
        console.error("[QUESTION] Erreur migration :", err);
    }
}

migrateJson();


function getQuestion(guildId) {

    let question = db.prepare(`
        SELECT *
        FROM questions
        WHERE guildId = ?
    `).get(guildId);


    if (!question) {

        db.prepare(`
            INSERT INTO questions (
                guildId,
                channel,
                title,
                description,
                answers,
                correct,
                answered
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
            guildId,
            null,
            null,
            null,
            "[]",
            null,
            "[]"
        );


        question = db.prepare(`
            SELECT *
            FROM questions
            WHERE guildId = ?
        `).get(guildId);
    }


    return {
        channel: question.channel,
        title: question.title,
        description: question.description,
        answers: JSON.parse(question.answers || "[]"),
        correct: question.correct,
        answered: JSON.parse(question.answered || "[]")
    };
}


function saveQuestion(guildId, data) {

    db.prepare(`
        UPDATE questions
        SET
            channel = ?,
            title = ?,
            description = ?,
            answers = ?,
            correct = ?,
            answered = ?
        WHERE guildId = ?
    `).run(
        data.channel,
        data.title,
        data.description,
        JSON.stringify(data.answers),
        data.correct,
        JSON.stringify(data.answered),
        guildId
    );
}
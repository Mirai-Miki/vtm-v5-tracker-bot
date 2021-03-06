/* Database.js
 * Author: Michael Bossner
 */

const fs = require("fs");

/*
 * Database class for storing a json object in a file and manipulating
 * key value pairs in the database.
 *
 * Methods:
 *    open(fileName, absolutePath);
 *    find(key);
 *    new(key, value);
 *    update(key, value);
 *    add(key, value);
 *    delete(key);
 *    delete_all();
 *    close();
 */
module.exports = class Database {
    constructor() {
        this.path;
        this.db = null;
    }

    /*
     * Opens a database json file located at the absolute path.
     * If the file exists the contents will be read into the Databse
     * object and can be accessed using the other methods. If it does not exist
     * a new database will be set up ready to be used.
     *
     * fileName:        Name of the database being opened
     * absolutePath:    Location of the file being opened if undefined it will
     *                  attempt to open the file from the current directory.
     */
    open(fileName, absolutePath=undefined) {
        if (!absolutePath) {
            this.path = (fileName + ".json");
        } else {
            this.path = (absolutePath + fileName + ".json");
        }
        let contents;
        if(fs.existsSync(this.path)) { // Database exists
            contents = fs.readFileSync(this.path, "utf-8");
            this.db = JSON.parse(contents);
        } else { // New database is set up
            this.db = {};
        }
    }

    /*
     * Searches the database for a value by the its key.
     *
     * key: The key being searched in the database.
     *
     * return: Returns the value if the key exists else returns undefined.
     */
    find(key) {
        return this.db[key];
    }

    /*
     * Adds a new key value pair to the database. This method does not
     * overwrite existing key value pairs with the same key.
     *
     * key: new key to be added to the database
     * value: new value to be assigned to the key
     *
     * return: returns 0 when the key value pair has been successfully added
     *         returns 1 if there is an existing key with the same name.
     */
    new(key, value) {
        if (this.db[key] != undefined) {
            return 1;
        }
        this.db[key] = value;
        return 0;
    }

    /*
     * Updates an existing key value pair in the database. This method does not
     * create a new key value pair if a key of the same name does not exist.
     *
     * key: key to be found in the database
     * value: value to be updated
     *
     * return: returns 0 when the key value pair has been successfully updated
     *         returns 1 if there is not a key with the same name in the db.
     */
    update(key, value) {
        if (this.db[key] == undefined) {
            return 1;
        }
        this.db[key] = value;
        return 0;
    }

    /*
     * Adds a new key value pair to the database. If a key already exists with
     * the same name it will be overwritten with the new value.
     */
    add(key, value) {
        this.db[key] = value;
    }

    /*
     * Deletes a key value pair from the database if it exists.
     *
     * key: key to be deleted from the database along with its value pair.
     *
     * return: returns 1 if there is no key to be found in the database
     *         returns 0 if the key was found and deleted.
     */
    delete(key) {
        if (this.db[key] == undefined) {
            return 1;
        }
        delete this.db[key];
        return 0;
    }

    /*
     * Deletes the database file if one exists.
     *
     * return: returns 1 if no database file exists.
     *         returns 0 if a file was found and deleted.
     */
    delete_all() {
        if(fs.existsSync(this.path)) { // Database exists
            fs.unlinkSync(this.path); // Delete file
            return 0;
        }
        return 1; 
    }

    /*
     * Checks if the database is empty.
     *
     * return: Returns true if the database is empty else returns false.
     */
    is_empty() {
        let count = 0;
        for (let key in this.db) {
            count++;
        }

        if (count) {
            return false;
        }
        return true;
    }

    /*
     * Finds the number of key value pairs in the database.
     *
     * return: Returns the number of key value pairs or 0 if the database is empty
     */
    length() {
        let count = 0;
        for (let key in this.db) {
            count++;
        }
        return count;
    }

    /*
     * Saves the contents of the database to the file that was opened.
     *
     * return: returns 0 if the file was successfully saved.
     *         returns 1 if the file was not saved correctly.
     */
    close() {
        let contents = JSON.stringify(this.db, null, 2);
        fs.writeFileSync(this.path, contents, "utf-8", (err) => {
            if (err) return 1;
        });
        return 0;
    }
}
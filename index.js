if (Number(process.version.slice(1).split('.')[0]) < 10) throw new Error('Node 10.0.0 or higher is required. Update Node on your system.');

var sqlite3 = require('sqlite3').verbose();
var fs = require('fs');

if (process.argv.length < 3) {
  console.error('ERROR: invalid process arguments - no plex database specified');
  process.exit(1);
} else {
  if (!fs.existsSync(process.argv[2])) {
    console.error('ERROR: Unable to find database - filename: ' + process.argv[2]);
    process.exit(1);
  }
}

console.log("starting process with " + process.argv[2]);
var db = new sqlite3.Database(process.argv[2]);
var queue = 0;
 
db.serialize(function() {
  db.each("select id, metadata_item_id, created_at, updated_at from media_items where created_at is not null", function(err, row) {
    queue++;
    console.log("adding #ID " + row.metadata_item_id + ": " + row.updated_at + " - queue: " + queue);
    db.serialize(function() {
      db.run("update metadata_items set added_at = ? where id = ?", [row.updated_at, row.metadata_item_id], function(err) {
        if (err) { return console.error(err.message); }
        queue--;
        console.log("row updated: " + this.changes + " - queue: " + queue);
      });
    });
  });
});
 
process.on('exit', () => {
  console.log('closing database connection.');
  db.close((err) => {
    if (err) { return console.error(err.message); }
  });
});

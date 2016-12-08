// ffmpeg -i $1.ts -c:v libx264 -preset medium -tune film -crf 23 -strict experimental -c:a aac -b:a 192k output.mp4

'use strict';

const fs           = require('fs'),
        INPUT_DIR  = process.env.INPUT_DIR || '.',
        OUTPUT_DIR = process.env.OUTPUT_DIR || '.',
        spawn      = require('child_process').spawn,
        redis      = require('redis'),
        _          = require('lodash');

const redisClient = redis.createClient();

function convert(filename) {
    let newFilename = filename.split('.')[0] + '.mp4';

    let ffmpeg = spawn('ffmpeg', [
        '-i',
        `${INPUT_DIR}/${filename}`,
        '-c:v',
        'libx264',
        '-preset',
        'medium',
        '-tune',
        'film',
        '-crf',
        '23',
        '-strict',
        'experimental',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        `${OUTPUT_DIR}/${newFilename}`
    ]);

    ffmpeg.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
        if (code === 0) {
            redisClient.publish('videofragment', `${newFilename}`);
            fs.createReadStream(`${OUTPUT_DIR}/${newFilename}`)
                .pipe(fs.createWriteStream(`${OUTPUT_DIR}/current.mp4`));
        }
    });
}

fs.watch(INPUT_DIR, {}, (eventType, filename) => {
    if (filename.indexOf('.ts') > -1) {
        _.debounce(convert(filename), 1500);
    }
});

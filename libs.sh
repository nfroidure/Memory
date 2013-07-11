# Install required libs
mkdir www/javascript/libs

# RequireJS
mkdir www/javascript/libs/requirejs
wget -O http://requirejs.org/docs/release/2.1.6/comments/require.js > www/javascript/libs/requirejs/require.js

# Commandor
mkdir www/javascript/libs/commandor
wget -O https://raw.github.com/nfroidure/Commandor/master/Commandor.js > www/javascript/libs/commandor/Commandor.js
wget -O https://raw.github.com/nfroidure/Commandor/master/CommandPromise.js > www/javascript/libs/commandor/CommandPromise.js

# Sounds
mkdir www/javascript/libs/sounds
wget -O https://raw.github.com/nfroidure/Sounds/master/Sounds.js > www/javascript/libs/sounds/Sounds.js

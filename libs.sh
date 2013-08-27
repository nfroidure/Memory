# Install required libs
mkdir www/javascript/libs

# RequireJS
mkdir www/javascript/libs/requirejs
wget -O http://requirejs.org/docs/release/2.1.6/comments/require.js > www/javascript/libs/requirejs/require.js

# Commandor
mkdir www/javascript/libs/commandor
mkdir www/javascript/libs/commandor/src
wget -O https://raw.github.com/nfroidure/Commandor/master/src/Commandor.js > www/javascript/libs/commandor/Commandor.js

# Sounds
mkdir www/javascript/libs/sounds
wget -O https://raw.github.com/nfroidure/Sounds/master/Sounds.js > www/javascript/libs/sounds/Sounds.js

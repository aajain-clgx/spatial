external
========
This directory is for node modules upon which spatial depends.

We will check in the full directory of each node module dependency, minus 
whatever is skipped by this application's .gitignore file. (We won't check in 
compiled modules, but that isn't an issue we've had to deal with so far.) This 
is so we can most safely manage our dependencies: running 'npm install' every 
time will install the latest version of the module, which may cause problems.

There is a node module called 'shrinkwrap' that may help with managing 
dependencies, but for now we see no good reason to do anything other than check 
in the code we'll be using. If we need to update a dependency, we'll be able
to manage it more easily in this way.

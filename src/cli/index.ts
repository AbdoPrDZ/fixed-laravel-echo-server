import { Cli } from './cli';

let cli = new Cli();

var called = {
  start: false,
  stop: false,
  configure: false,
  clientAdd: false,
  clientRemove: false,
};

let yargs = require('yargs')
    .usage("Usage: fixed-laravel-echo-server <command> [options]")
    .command("start", "Starts the server.", (yargs) => {
      if(!called.start) cli.start(yargs);
      called.start = true;
    })
    .command("stop", "Stops the server.", (yargs) => {
      if(!called.stop) cli.stop(yargs);
      called.stop = true;
    })
    .command(["configure", "init"], "Creates a custom config file.", (yargs) => {
      if(!called.configure) cli.configure(yargs);
      called.configure = true;
    }) // Has an alias of "init" for backwards compatibility, remove in next version
    .command("client:add [id]", "Register a client that can make api requests.", (yargs) => {
      if(!called.clientAdd) cli.clientAdd(yargs);
      called.clientAdd = true;
    })
    .command("client:remove [id]", "Remove a registered client.", (yargs) => {
      if(!called.clientRemove) cli.clientRemove(yargs);
      called.clientRemove = true;
    })
    .demandCommand(1, "Please provide a valid command.")
    .help("help")
    .alias("help", "h");

yargs.$0 = '';

var argv = yargs.argv;

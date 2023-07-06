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
    .command("start", "Starts the server.", (args) => {
      if(!called.start) {
        cli.start(args);
        called.start = true;
      }
    })
    .command("stop", "Stops the server.", (args) => {
      if(!called.stop) {
        cli.stop(args);
        called.stop = true;
      }
    })
    .command(["configure", "init"], "Creates a custom config file.", (args) => {
      if(!called.configure) {
        cli.configure(args);
        called.configure = true;
      }
    }) // Has an alias of "init" for backwards compatibility, remove in next version
    .command("client:add [id]", "Register a client that can make api requests.", (args) => {
      if(!called.clientAdd) {
        cli.clientAdd(args);
        called.clientAdd = true;
      }
    })
    .command("client:remove [id]", "Remove a registered client.", (args) => {
      if(!called.clientRemove) {
        cli.clientRemove(args);
        called.clientRemove = true;
      }
    })
    .demandCommand(1, "Please provide a valid command.")
    .help("help")
    .alias("help", "h");

yargs.$0 = '';

var argv = yargs.argv;

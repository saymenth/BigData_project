const command1 = new Deno.Command(
    Deno.execPath(),
    {
        args: ['run', '--allow-read', '--allow-write', 'weather.js'],
    }
);

const command2 = new Deno.Command(
    Deno.execPath(),
    {
        args: ['run', '--allow-read', '--allow-write', 'traffic.js'],
    }
);

command1.outputSync();
command2.outputSync();

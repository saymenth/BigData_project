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

const command3 = new Deno.Command(
    Deno.execPath(),
    {
        args: ['run', '--allow-read', '--allow-write', 'join.js'],
    }
);

command1.outputSync();
command2.outputSync();
command3.outputSync();

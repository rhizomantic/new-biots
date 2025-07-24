var cf, config, configs = [];

cf = {
    name: 'swarm_test',

    init: function() {
        let out = {
            num: 1,
            // pos: {x:{src:'rnd', mx:skw}, y:{src:'rnd', mx:skh}},
            pos: {x:skw*0.5, y:skh*0.8},
            life: 600,
            rad: {src:'t', cv:'cos', pw:0.3, mn:0, mx:10},
            col: [192, 0, 0],
            forces: [
                {ty:'wind', f:0.1, a:-PI/2},
                {ty:'grid'}
            ],
            children:[
                {
                    every: 12,
                    pos: {x:{src:'rnd', mn:-20, mx:20}, y:{src:'rnd', mn:-20, mx:20}},
                    life: 1800,
                    rad: {src:'t', cv:'cos', pw:0.3, mn:0, mx:12},
                    size: 1,
                    col: {src:'t', cs:['#FFCC00','#00CCFF']},
                    // rot: 0,
                    // alpha: {src:'t', cv:'cos', mn:0, mx:200},
                    damp: 0.92,
                    wrap: true,
                    forces:[
                        {ty:'grid'},
                        // {ty:'noisewind', f:0.2, vv:0, iv:0.1, tv:0.02, cn:1.2}
                        {ty:'swarm', f:0.006},
                        {ty:'align', f:0.001},
                        {ty:'forward', f:0.1}
                    ]
                }
            ]
        }

        return out;
    }
}
configs.push(cf);


cf = {
    name: 'nube_simple',

    init: function() {
        let out = {
            num: 1,
            // pos: {x:{src:'rnd', mx:skw}, y:{src:'rnd', mx:skh}},
            pos: {x:skw*0.5, y:skh*0.5},
            life: 0,
            rad: 2,
            col: [192, 0, 0],
            forces: [
                // {ty:'grid'}
            ],
            children:[
                {
                    every: 16,
                    // pos: {a:{src:'ix', cv:'ix', vi:0.2}, r: 60},//{src:'rnd', mx:skw*0.15}},
                    pos: {a:{src:'rnd', mn:-PI, mx:PI}, r: 60, ref:'prev'},
                    life: 1200,
                    rad: {src:'t', cv:'cos', pw:0.3, mn:0, mx:20},
                    size: 1.5,
                    col: {src:'t', cs:[front[0], front[front.length-1]]},
                    damp: 0.6,
                    limit:4,
                    wrap: true,
                    forces:[
                        {ty:'grid'},
                        // {ty:'noisewind', f:0.3, vv:0, iv:0.03, tv:0.003, cn:1.2}
                        // {ty:'pull', f:-0.0012, ref:'dad'},
                        {ty:'spring', len:32, f:0.01, ref:'prev', bi:false},
                        // {ty:'spring', len:{src:'t', cv:'cos', cy:1, mn:skw*0.1, mx:skw*0.5}, f:0.001, ref:'dad'},
                        // {ty:'brownian', every:5, f:{src:'t', pw:3, mn:0, mx:3}},

                    ]
                }
            ]
        }

        return out;
    }
}
configs.push(cf);


cf = {
    name: 'fizzy',

    init: function() {
        let lf = 120;

        let out = {
            num: 1,
            pos: {x:skw*0.5, y:skh*0.5},
            life: lf,
            rad: 24,
            col: front[0],
            forces: [],
            children:[]
        }

        let levels = 5;
        let last = out;
        for(let i=0; i<levels; i++){
            let ch = {
                since: lf-1,
                num: 2,
                pos: {r:3, a:{src:'rnd', mn:-PI, mx:PI}},
                life: lf * 1.5,
                rad: 24 / (i+2),
                col: front[i+1],
                damp: 0.9,
                forces: [
                    {ty:'grid'},
                    // {ty:'noisewind', f:0.05, vv:0, iv:0.03, tv:0.01, cn:1.2},
                    {ty:'noisecurl', f:0.2, vv:0, iv:0.03, tv:0.05, am:0.1},
                ],
                children: []
            }
            last.children.push(ch)
            last = ch;
            lf *= 1.5;
        }

        return out;
    }
}
configs.push(cf);


cf = {
    name: 'repulsores',

    init: function() {
        let reps = {
            name: 'reps',
            num: 8,
            life: 0,
            rad: 4,
            col: [192, 0, 0],
        }

        let out = {
            num: 1,
            pos: {x:skw*0.5, y:skh*0.5},
            life: 0,
            rad: 2,
            col: [0, 0, 192],
            forces: [
            ],
            children:[
                {
                    every: 6,
                    pos: {a:{src:'rnd', mn:-PI, mx:PI}, r:{src:'rnd', mx:skw*0.5}},
                    life: 1200,
                    rad: {src:'t', cv:'cos', pw:0.3, mn:0, mx:20},
                    size: 1.5,
                    col: {src:'t', cs:[front[0], front[front.length-1]]},
                    damp: 0.6,
                    limit:4,
                    wrap: true,
                    forces:[
                        {ty:'grid'},
                        // {ty:'noisewind', f:0.3, vv:0, iv:0.03, tv:0.003, cn:1.2}
                        // {ty:'pull', f:-0.01, ref:'reps'},
                        {ty:'reach', len:200, f:-1, ref:'reps'},

                    ]
                }
            ]
        }

        return [reps, out];
    }
}
configs.push(cf);


cf = {
    name: 'filas noise curl',

    init: function() {
        let out = {
            num: 5,
            // pos: {x:{src:'rnd', mx:skw}, y:{src:'rnd', mx:skh}},
            // pos: {x:skw*0.5, y:skh*0.5},
            life: 0,
            rad: 2,
            col: [192, 0, 0],
            forces: [
                // {ty:'grid'}
            ],
            children:[
                {
                    every: 16,
                    pos: {x:0, y:0},//{src:'rnd', mx:skw*0.15}},
                    life: 900,
                    rad: {src:'t', cv:'cos', pw:0.3, mn:0, mx:16},
                    size: 1.5,
                    col: {src:'t', cs:[front[0], front[front.length-1]]},
                    damp: 0.6,
                    limit:4,
                    wrap: true,
                    forces:[
                        {ty:'grid'},
                        {ty:'noisecurl', f:0.8, a:-PI/2, vv:{src:'d-gen', mx:8}, iv:0.00, tv:0.02, am:0.1},

                    ]
                }
            ]
        }

        return out;
    }
}
configs.push(cf);

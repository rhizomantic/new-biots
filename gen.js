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
                    every: 18,
                    pos: {a:{src:'rnd', mn:-PI, mx:PI}, r:{src:'rnd', mx:skw*0.15}},
                    life: 800,
                    rad: {src:'t', cv:'cos', pw:0.3, mn:0, mx:24},
                    size: 1.5,
                    col: {src:'t', cs:[front[0], front[front.length-1]]},
                    damp: 0.6,
                    limit:4,
                    wrap: false,
                    forces:[
                        {ty:'grid'},
                        // {ty:'noisewind', f:0.3, vv:0, iv:0.03, tv:0.003, cn:1.2}
                        {ty:'pull', f:-0.0012, ref:'dad'},
                        {ty:'spring', len:32, f:0.02, ref:'prev', bi:false},
                        // {ty:'spring', len:skw*0.25, f:0.001, ref:'dad'},

                    ]
                }
            ]
        }

        return out;
    }
}
configs.push(cf);

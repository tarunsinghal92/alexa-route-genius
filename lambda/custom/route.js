// load packages
const request = require('request-promise');
const cheerio = require('cheerio');
const webshot = require('webshot');



request({
        uri: `https://runkeeper.com/search/routes?lon=-79.3966091&lat=43.6492136&distance=5`,
        transform: function(body) {
            return cheerio.load(body);
        }
    })
    .then(($) => {

        
            // image list
            var imgs = ['https://preview.ibb.co/c6ju78/1.png',
                        'https://preview.ibb.co/dEPGLT/2.png',
                        'https://image.ibb.co/jRK5Eo/3.png',
                        'https://image.ibb.co/nPYXuo/4.png',
                        'https://preview.ibb.co/inYAfT/5.png',
                        'https://preview.ibb.co/n3xE78/6.png']
            // get list of routes
            var routes = []
            $('.routeResultTile').each(function(i, ele) {
                var tmp = {}
                tmp.url = $(this).find('.thumbnailUrl')[0].attribs.href
                tmp.distance = $(this).find('.routeDistanceLabel').text().trim()
                tmp.owner = $(this).find('.routesuteOwnwer').text()
                tmp.id = tmp.url.split('/').pop()
                tmp.img_url = imgs[i]
                routes.push(tmp)
            });

        // // add more data to routes
        // routes.map(function(route, i) {

        //     // call request
        //     var url = `https://runkeeper.com${route.url}`
        //     var filename = `image_${route.id}_${i}.png`
        //     webshot(url, filename, function(err) {
        //         console.log(err)
        //     });

        //     // return 
        //     return route
        // })
    })
    .catch((err) => {
        console.log(err);
    });
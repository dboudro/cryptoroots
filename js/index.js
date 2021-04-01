    var app = new Vue({
        el: '#app',
        data: {
            show: false,
            editable: false,
            newlinkname: "",
            newlinkurl: "",
            newlinkdescription: "",
            globaltaglist: ['test'],
            search: '',
            bookmarks: [
                {
                    text: 'Test Link',
                    hyperlink: 'https:zksync.io',
                    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus vel lectus ut turpis fermentum vestibulum. ',
                    taglist: ['testing', 'tag2'],
                    newtag: '',
                    favorited: false,
                    lastlocation: -1
                }

        ]},
        methods: {
            addLink: function () {
                let newbookmark = {
                    text: this.newlinkname,
                    hyperlink: this.newlinkurl,
                    description: this.newlinkdescription,
                    taglist: ['newtag'],
                    favorited: false,
                    lastlocation: -1
                };
                this.bookmarks.splice(this.favoritedBookmarks().length, 0, newbookmark)
                this.newlinkname = "";
                this.newlinkurl = "";
                this.newlinkdescription = "";

                this.toggleShow()

                // post to firebase
                this.$http.post('https://roots-network-69742.firebaseio.com/crypto.json', newbookmark).then(function (data) {
                  console.log(data)
                })
            },
            toggleShow: function () {
                app.show = !app.show
            },
            toggleEdit: function () {
                app.editable = !app.editable
            },
            favoriteBookmark: function (link, event) {
                if (link.favorited) {
                    this.unfavorite(link);
                } else {
                    let linkLocation = app.bookmarks.indexOf(link)
                    link.lastlocation = linkLocation;
                    app.bookmarks.splice(linkLocation, 1)
                    app.bookmarks.unshift(link);
                    link.favorited = !link.favorited;
                    this.$http.put('https://roots-network-69742.firebaseio.com/crypto.json', this.bookmarks).then(function (data) {
                        console.log('PUT FAV')
                    })

                }
            },
            put: function (link) {
                this.$http.put('https://roots-network-69742.firebaseio.com/crypto.json', this.bookmarks).then(function (data) {
                    alert('Database Updated Succesfully');
                })
            },
            unfavorite: function (link, event) {
                console.log('running unfavorite')
                let linkLocation = app.bookmarks.indexOf(link)
                app.bookmarks.splice(linkLocation, 1)
                app.bookmarks.splice(link.lastlocation, 0, link)
                link.favorited = !link.favorited;
                this.$http.put('https://roots-network-69742.firebaseio.com/crypto.json', this.bookmarks).then(function (data) {
                    console.log('PUT UNFAV')
                })
            },
            removeBookmark: function (link) {
                let linkLocation = app.bookmarks.indexOf(link)
                if (linkLocation !== -1 && confirm("Are you sure you want to delete this bookmark?")) {
                    app.bookmarks.splice(linkLocation, 1)
                    this.$http.delete('https://roots-network-69742.firebaseio.com/crypto/' + link.id + '/.json', link.id).then(function (data) {
                        console.log('https://roots-network-69742.firebaseio.com/crypto/' + link.id + '/.json');
                    })
                }
            },
             favoritedBookmarks: function () {
                return this.bookmarks.filter((bookmark) => {
                    return bookmark.favorited === true;
                });
            },
            searchArray: function(nameKey, myArray) {
               for (var i=0; i < myArray.length; i++) {
                  if (myArray[i].name === nameKey) {
                    return myArray[i];
                  }
                }
            },
            searchArrayBool: function(nameKey, myArray) {
               for (var i=0; i < myArray.length; i++) {
                  if (myArray[i] === nameKey) {
                    return true;
                  }
                }
            },
            genglobaltaglist: function() {
              let result = [];
              for (i = 0; i < this.bookmarks.length; i++ ) {
                // if statement for case where taglist = undefined
                if (this.bookmarks[i].taglist) {
                  for (j = 0; j < this.bookmarks[i].taglist.length; j++) {
                   // IF THE TAG IS IN THE LIST increase the count
                   // if Result has an object with this key
                   let key = this.bookmarks[i].taglist[j].toString()
                    if (this.searchArray(key, result)) {
                      let sameTag = result.find(x => x.name === key.toString())
                      sameTag.count++
                    }
                    // ELSE add the tag
                    else {
                      result.push({name: key, count: 1})
                    }
                  
                  }
                }
                
              }
              return result;
            },
            removeTag: function (link, tag) {
              for (i = 0; i < link.taglist.length; i++) {
                console.log('removetag', 'tag: ', tag, 'link.taglist[i]', link.taglist[i])
                console.log((tag === link.taglist[i]))
                if (tag === link.taglist[i]) {
                  link.taglist.splice(i, 1);
                }
              }
              this.$http.put('https://roots-network-69742.firebaseio.com/crypto.json', this.bookmarks).then(function (data) {
                    console.log('PUT removetag')
                })
            },
            addTag: function (link, tag) {
             link.taglist.push(link.newtag.toLowerCase());
             link.newtag = "";
             this.$http.put('https://roots-network-69742.firebaseio.com/crypto.json', this.bookmarks).then(function (data) {
                    console.log('PUT addTag')
                })
            },
            tagFilter: function(tag) {
              this.search = '_' + tag.name;
            }
        },

        created() {
            this.$http.get('https://roots-network-69742.firebaseio.com/crypto.json').then(function (data) {
                // this.bookmarks=data.body;
                return data.json()
            }).then(function (data) {
                let fireBookmarks = [];
                for (let key in data) {
                    if (data[key]) {
                        data[key].id = key;
                        fireBookmarks.push(data[key])
                    }
                    this.bookmarks = fireBookmarks;
                }
                // console.log(fireBookmarks)
                app.genglobaltaglist();
            })
        },
        computed: {
            filteredBookmarks: function () {
                return this.bookmarks.filter((bookmark) => {
                  // if searching by tag
                  if (bookmark.taglist && this.search.substring(0, 1) === '_') {
                     let searchCleaned = this.search.substring(1).toLowerCase()
                     console.log(this.searchArrayBool(searchCleaned, bookmark.taglist))
                     return this.searchArrayBool(searchCleaned, bookmark.taglist)
                     }
                     // if searching by title
                  else {
                    return bookmark.text.toLowerCase().match(this.search.toLowerCase())
                  }
                });
            },
            // generate a list of tags and their counts with counts over 10
            popularTagsList: function() {
               return this.genglobaltaglist().filter((bookmark) => {
                    return bookmark.count > 3;
                });

            }
        }
            
    })
var app = angular.module('JukeTubeApp', []);

// Run

app.run(function() {
 var tag = document.createElement('script');
 tag.src = "http://www.youtube.com/iframe_api";
 var firstScriptTag = document.getElementsByTagName('script')[0];
 firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
});

// Config

app.config(function($httpProvider) {
 delete $httpProvider.defaults.headers.common['X-Requested-With'];
});

// Service

app.service('VideosService', ['$window', '$rootScope', '$log', function($window, $rootScope, $log) {

 var service = this;
 var youtube = {
  ready: false,
  player: null,
  playerId: null,
  videoId: null,
  videoTitle: null,
  state: 'playing'
 };
 var results = [];

 var upcoming = [{
  id: '5rvCbPJkmqs',
  title: '빈지노 (Beenzino) - Life In Color MV'
 }, {
  id: '65zY1720sao',
  title: '[MV] Verbal Jint(버벌진트), Sanchez(산체스) (팬텀) _ Doin\' It(싫대) (Feat. Bumkey(범키))'
 }, {
  id: 'ewjucLierFc',
  title: '지코 (ZICO) - 너는 나 나는 너 (I Am You, You Are Me) MV'
 }, {
  id: 'OuvFs9pj9jk',
  title: '팔로알토 (Paloalto) - Fancy (Feat. DEAN & Sway D)'
 }, {
  id: 'rCeM57e2BfU',
  title: '헤이즈 (Heize) - And July (Feat. DEAN, DJ Friz) MV'
 }, {
  id: 'Ibb5RhoKfzE',
  title: '[MV] Zion.T _ Eat(꺼내 먹어요)'
 }, {
  id: 'Ywjmoco2xXA',
  title: '레디(Reddy) - 생각해 (Feat. 박재범) MV'
 }];
 var history = [{
  id: '96es5i6FzDc',
  title: '[MV] GIRIBOY(기리보이) _ Hogu(호구)'
 }];

 $window.onYouTubeIframeAPIReady = function() {
  $log.info('Youtube API is ready');
  youtube.ready = true;
  service.bindPlayer('placeholder');
  service.loadPlayer();
  $rootScope.$apply();
 };

 function onYoutubeReady(event) {
  $log.info('YouTube Player is ready');
  youtube.player.cueVideoById(history[0].id);
  youtube.videoId = history[0].id;
  youtube.videoTitle = history[0].title;
  youtube.player.playVideo();

 }

 function onYoutubeStateChange(event) {
  if (event.data == YT.PlayerState.PLAYING) {
   youtube.state = 'playing';
  } else if (event.data == YT.PlayerState.PAUSED) {
   youtube.state = 'paused';
  } else if (event.data == YT.PlayerState.ENDED) {
   youtube.state = 'ended';
   service.launchPlayer(upcoming[0].id, upcoming[0].title);
   service.archiveVideo(upcoming[0].id, upcoming[0].title);
   service.deleteVideo(upcoming, upcoming[0].id);
  }
  $rootScope.$apply();
 }

 this.bindPlayer = function(elementId) {
  $log.info('Binding to ' + elementId);
  youtube.playerId = elementId;
 };

 this.createPlayer = function() {
  $log.info('Creating a new Youtube player for DOM id ' + youtube.playerId + ' and video ' + youtube.videoId);
  return new YT.Player(youtube.playerId, {
   playerVars: {
    'rel': 0,
    'showinfo': 0,
    'autoplay': 1,
    'controls': 0,
    'modestbranding': 1
   },
   events: {
    'onReady': onYoutubeReady,
    'onStateChange': onYoutubeStateChange
   }
  });
 };

 this.loadPlayer = function() {
  if (youtube.ready && youtube.playerId) {
   if (youtube.player) {
    youtube.player.destroy();
   }
   youtube.player = service.createPlayer();
  }
 };

 this.launchPlayer = function(id, title) {
  youtube.player.loadVideoById(id);
  youtube.videoId = id;
  youtube.videoTitle = title;
  return youtube;
 }

 this.listResults = function(data) {
  results.length = 0;
  for (var i = data.items.length - 1; i >= 0; i--) {
   results.push({
    id: data.items[i].id.videoId,
    title: data.items[i].snippet.title,
    description: data.items[i].snippet.description,
    thumbnail: data.items[i].snippet.thumbnails.default.url,
    author: data.items[i].snippet.channelTitle
   });
  }
  return results;
 }

 this.queueVideo = function(id, title) {
  upcoming.push({
   id: id,
   title: title
  });
  return upcoming;
 };

 this.archiveVideo = function(id, title) {
  history.unshift({
   id: id,
   title: title
  });
  return history;
 };

 this.deleteVideo = function(list, id) {
  for (var i = list.length - 1; i >= 0; i--) {
   if (list[i].id === id) {
    list.splice(i, 1);
    break;
   }
  }
 };

 this.getYoutube = function() {
  return youtube;
 };

 this.getResults = function() {
  return results;
 };

 this.getUpcoming = function() {
  return upcoming;
 };

 this.getHistory = function() {
  return history;
 };

}]);

// Controller

app.controller('VideosController', function($scope, $http, $log, VideosService) {

 init();

 function init() {
  $scope.youtube = VideosService.getYoutube();
  $scope.results = VideosService.getResults();
  $scope.upcoming = VideosService.getUpcoming();
  $scope.history = VideosService.getHistory();
  $scope.playlist = true;
 }


 $scope.launch = function(id, title) {
  VideosService.launchPlayer(id, title);
  VideosService.archiveVideo(id, title);
  VideosService.deleteVideo($scope.upcoming, id);
  $log.info('Launched id:' + id + ' and title:' + title);
 };

 $scope.queue = function(id, title) {
  VideosService.queueVideo(id, title);
  VideosService.deleteVideo($scope.history, id);
  $log.info('Queued id:' + id + ' and title:' + title);
  $("input[type=text], textarea").val("");
  $scope.results = $scope.origData;
  $('#overlay-search').removeClass('open');
 };

 $scope.delete = function(list, id) {
  VideosService.deleteVideo($scope.upcoming, id);
 };


 $scope.search = function() {
  $http.get('https://www.googleapis.com/youtube/v3/search', {
    params: {
     key: 'AIzaSyCARc1XWs6s-bkrvh_Bdd3YPjjrWlDDSUw',
     type: 'video',
     videoEmbeddable: 'true',
     order: 'relevance',
     maxResults: '8',
     part: 'id,snippet',
     fields: 'items/id,items/snippet/title,items/snippet/description,items/snippet/thumbnails/default,items/snippet/channelTitle',
     q: this.query
    }
   })
   .success(function(data) {
    VideosService.listResults(data);
    $log.info(data);
   })
   .error(function() {
    $log.info('Search error');
   });
 }

 $scope.tabulate = function(state) {
  $scope.playlist = state;
 }

 $scope.customPlaylists= [];
 $http.get('playlists/playlist-masterlist.json').success(function(data) {
    $scope.customPlaylists = data;
});

 $scope.loadPlaylist = function(playlist) {
  $http.get(playlist)
   .then(function(res) {
    var json = JSON.stringify(res.data);
    $.each($.parseJSON(json), function() {
     VideosService.queueVideo(this.id, this.title);
    });
    $('#overlay-playlist').removeClass('open');
   });
 }
});

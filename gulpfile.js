var gulp			= require('gulp');

var git				= require('gulp-git');
var bump			= require('gulp-bump');
var tagVersion		= require('gulp-tag-version');
var fs				= require('fs');
var argv			= require('yargs').argv;
var log				= require('fancy-log');
var childProcess	= require('child_process');
var runSequence		= require('run-sequence');

// task for bumping version and commit new version
gulp.task('new-version', function() {
	var importance = '';
	if (argv.patch) {
		importance = 'patch';
	}
	if (argv.minor) {
		importance = 'minor';
	}
	if (argv.major) {
		importance = 'major';
	}
	if (importance === '') {
		log.error('Use minor/major/patch flag, like this gulp deploy --patch');
		return process.exit(0);
	}
	return gulp.src('./package.json')
		.pipe(bump({type: importance}))
		.pipe(gulp.dest('./'))
		.pipe(git.commit('auto deploy new version'))
		.pipe(tagVersion());
});

// task for building docker images
gulp.task('docker:build', function() {
	var json = JSON.parse(fs.readFileSync('./package.json')),
		versions = json['version'].split('.'),
		version = '',
		// using repo and docker-name to make full path
		dockerName = json['repository-docker']+json['docker-name'],
		// getting all dockers file to build, the last (alphabet) will be last,
		// and used for versions tags
		dockers = fs.readdirSync('dockers').sort();

	// building and pushing docker images for every php version
	var dockerImageName = '',
		dockerFilename = '';

	// building for every file in dockers folder
	dockers.forEach(function(phpVersion) {
		dockerFilename = 'dockers/'+phpVersion;
		dockerImageName = dockerName+':'+phpVersion;
		log('Building docker image "'+dockerImageName+'"...');
		childProcess.execSync('docker build -f '+dockerFilename+' -t '+dockerImageName+' .', log.error);
	});

	// using last docker image name as base image for versions images
	versions.forEach(function(value) {
		version += ((version === '')?'':'.')+value;
		var newDockerImageName = dockerName+':'+version;
		log('Tagging docker image "'+dockerImageName+'" to "'+newDockerImageName+'"...');
		childProcess.execSync('docker tag '+dockerImageName+' '+newDockerImageName, log.error);
	});

	// adding latest tag
	var newDockerImageName = dockerName + ':' + 'latest';
	log('Tagging docker image "'+dockerImageName+'" to "'+newDockerImageName+'"...');
	childProcess.execSync('docker tag '+dockerImageName+' '+newDockerImageName, log.error);
});

// task for pushing docker images
gulp.task('docker:push', function() {
	var json = JSON.parse(fs.readFileSync('./package.json')),
		dockerName = json['repository-docker']+json['docker-name'];

	childProcess.execSync('docker push '+dockerName, log.error);
});

// task adding new version, building docker images and then pushes them
gulp.task('deploy', function() {
	runSequence('new-version', 'docker:build', 'docker:push');
});
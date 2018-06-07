var gulp			= require('gulp');

var git				= require('gulp-git');
var tagVersion		= require('gulp-tag-version');
var fs				= require('fs');
var argv			= require('yargs').argv;
var log				= require('fancy-log');
var childProcess	= require('child_process');

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

gulp.task('docker-push', function() {
	var json = JSON.parse(fs.readFileSync('./package.json')),
		versions = json['version'].split('.').unshift('latest'),
		version = '',
		dockerName = json['repository-docker']+json['docker-name'],
		dockers = ['php5.6', 'php7.1', 'php7.2'];

	// building and pushing docker images for every php version
	var dockerImageName = '',
		dockerFilename = '';
	dockers.forEach(function(phpVersion) {
		dockerFilename = 'dockers/'+phpVersion;
		dockerImageName = dockerName+':'+phpVersion;
		log('Building docker image "'+dockerImageName+'"...');
		childProcess.execSync('docker build -f '+dockerFilename+' -t '+dockerName+' .', log.error);
		log('Pushing docker image "'+dockerImageName+'"...');
		childProcess.execSync('docker push '+dockerImageName, log.error);
	});

	// using last docker image name as base image for latest and versions images
	versions.forEach(function(value) {
		version += ((version === '')?'':'.')+value;
		var newDockerImageName = dockerName+':'+version;
		log('Tag and pushing docker image "'+newDockerImageName+'"...');
		childProcess.execSync('docker tag '+dockerImageName+' '+newDockerImageName, log.error);
		childProcess.execSync('docker push '+newDockerImageName, log.error);
	});

});

gulp.task('deploy', ['new-version', 'docker-push']);
set :deploy_to, '~/githubhook-client/'
set :user, 'deployer'
set :branch, 'dev'
role :app, %w{deployer@192.168.1.150}
server '192.168.1.150', user: 'deployer', roles: %w{web} 

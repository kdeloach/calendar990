# -*- mode: ruby -*-
# vi: set ft=ruby :

VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.provision :shell,
    :path => "scripts/bootstrap.sh",
    :env => {
      :BUCKET => ENV["CALENDAR990_BUCKET"],
      :AWS_ACCESS_KEY_ID => ENV["CALENDAR990_AWS_ACCESS_KEY_ID"],
      :AWS_SECRET_ACCESS_KEY => ENV["CALENDAR990_AWS_SECRET_ACCESS_KEY"]
    }
end

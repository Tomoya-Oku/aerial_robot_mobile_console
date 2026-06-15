#!/bin/zsh

# Xcode Cloud post-clone script for the DRACON React Native app.
# Xcode Cloud の macOS イメージには Node も JS/Pods 依存も入っていないため、
# clone 直後にここで揃える。これが無いと RN の build phase が node を見つけられず失敗する。

set -e
set -x

# Homebrew を非対話で使う
export HOMEBREW_NO_INSTALL_CLEANUP=1
export HOMEBREW_NO_AUTO_UPDATE=1

# Node 20 (package.json の engines に合わせる)
brew install node@20
brew link --overwrite --force node@20

# CocoaPods は Gemfile でバージョンを固定しているので bundler 経由で入れる
gem install bundler --no-document

# リポジトリルート (Gemfile / package.json がある場所)
cd "$CI_PRIMARY_REPOSITORY_PATH"

# JS 依存
npm ci

# Ruby 依存 (CocoaPods)
bundle install

# Pods
cd ios
bundle exec pod install

echo "✅ ci_post_clone finished"

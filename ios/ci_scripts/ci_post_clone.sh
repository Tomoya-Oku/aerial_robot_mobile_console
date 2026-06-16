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

# アーカイブ時の build phase ("Bundle React Native code and images") は
# with-environment.sh 経由で .xcode.env を読むが、そのシェルの PATH には
# Homebrew の /opt/homebrew/bin が含まれず `command -v node` が空になり exit 65 で落ちる。
# node の絶対パスを .xcode.env.local (gitignore 済み) に書き出して固定する。
NODE_BINARY_PATH="$(command -v node)"
echo "export NODE_BINARY=${NODE_BINARY_PATH}" > "$CI_PRIMARY_REPOSITORY_PATH/ios/.xcode.env.local"

# Ruby (bundler / CocoaPods 用)
# Xcode Cloud のシステム Ruby は /Library/Ruby/Gems が書き込み不可で
# `gem install` が Gem::FilePermissionError になる。Homebrew の Ruby を使うと
# gem ディレクトリが書き込み可能になり、CocoaPods/activesupport の要求バージョンも満たせる。
brew install ruby
export PATH="$(brew --prefix ruby)/bin:$PATH"
export PATH="$(gem environment gemdir)/bin:$PATH"

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

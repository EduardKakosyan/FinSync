# Dangerfile for FinSync

# Check if PR is too large
warn("This PR is quite large. Consider breaking it into smaller PRs for easier review.") if git.lines_of_code > 500

# Check for missing tests
has_app_changes = !git.modified_files.grep(/FinSync\/.*\.swift/).empty?
has_test_changes = !git.modified_files.grep(/.*Tests\/.*\.swift/).empty?

if has_app_changes && !has_test_changes
  warn("You've made changes to app code but haven't added any tests. Please consider adding tests to ensure your changes work correctly.")
end

# Check for print statements (should use proper logging)
print_statements = git.modified_files.map do |file|
  next unless file.end_with?('.swift')
  
  git.diff_for_file(file).patch.scan(/^\+.*print\(/).count
end.compact.sum

warn("Found #{print_statements} print statement(s). Consider using proper logging instead.") if print_statements > 0

# Check for force unwrapping
force_unwraps = git.modified_files.map do |file|
  next unless file.end_with?('.swift')
  
  git.diff_for_file(file).patch.scan(/^\+.*!(?!\=)/).count
end.compact.sum

warn("Found #{force_unwraps} force unwrap(s). Consider using safe unwrapping instead.") if force_unwraps > 0

# Check for TODO comments
todos = git.modified_files.map do |file|
  next unless file.end_with?('.swift')
  
  git.diff_for_file(file).patch.scan(/^\+.*TODO/).count
end.compact.sum

warn("Found #{todos} TODO comment(s). Please create GitHub issues for tracking.") if todos > 0

# Check for proper commit message format
commit_messages = git.commits.map(&:message)
conventional_commits = commit_messages.select { |msg| msg.match(/^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+/) }

if conventional_commits.length != commit_messages.length
  warn("Some commits don't follow conventional commit format. Please use format: type(scope): description")
end

# Check for SwiftUI best practices
swiftui_files = git.modified_files.select { |file| file.end_with?('.swift') }

swiftui_files.each do |file|
  file_content = File.read(file)
  
  # Check for @State in ViewModels (should use @Published)
  if file.include?('ViewModel') && file_content.include?('@State')
    warn("Found @State in #{file}. ViewModels should use @Published instead.")
  end
  
  # Check for missing @MainActor on ViewModels
  if file.include?('ViewModel') && !file_content.include?('@MainActor')
    warn("ViewModel #{file} should be marked with @MainActor.")
  end
end

# Success message
message("Thanks for contributing to FinSync! 🚀") unless status_report[:errors].any? || status_report[:warnings].any?
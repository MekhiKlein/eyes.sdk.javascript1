# frozen_string_literal: true

require 'applitools/selenium/configuration'
require 'timeout'
require 'securerandom'

module Applitools
  module Selenium
    class VisualGridEyes
      # new open, with eyes-manager
      include Applitools::UniversalEyesOpen
      # all checks here
      include Applitools::UniversalEyesChecks
      # add extract_text, extract_text_regions, locate
      include Applitools::UniversalNewApi

      include Applitools::Selenium::Concerns::SeleniumEyes
      USE_DEFAULT_MATCH_TIMEOUT = -1
      extend Forwardable

      def_delegators 'Applitools::EyesLogger', :logger, :log_handler, :log_handler=

      attr_accessor :visual_grid_manager, :driver, :current_url, :current_config, :fetched_cache_map,
        :utils,
        :enable_patterns,
        :config, :driver_lock, :test_uuid, :dont_get_title
      attr_accessor :test_list

      attr_accessor :api_key, :server_url, :proxy, :opened

      attr_accessor :size_mod, :region_to_check
      private :size_mod, :size_mod=, :region_to_check, :region_to_check=, :test_uuid, :test_uuid=, :config, :config=

      def_delegators 'config', *Applitools::Selenium::Configuration.methods_to_delegate
      def_delegators 'config', *Applitools::EyesBaseConfiguration.methods_to_delegate

      alias runner visual_grid_manager
      attr_accessor :universal_eyes, :universal_driver
      attr_accessor :debug_screenshots, :save_failed_tests, :scale_ratio, :disabled, :stitching_overlap, :compare_with_parent_branch

      def initialize(visual_grid_manager, server_url = nil)
        ensure_config
        @server_connector = Applitools::Connectivity::ServerConnector.new(server_url)
        @server_connector.obtain_agent_id do
          full_agent_id
        end
        self.server_url = server_url if server_url
        self.visual_grid_manager = visual_grid_manager
        self.test_list = Applitools::Selenium::TestList.new
        self.opened = false
        self.test_list ||= Applitools::Selenium::TestList.new
        self.driver_lock = Mutex.new
        self.utils = Applitools::Utils::EyesSeleniumUtils
      end

      def ensure_config
        self.config = Applitools::Selenium::Configuration.new
        self.send_dom = true
      end

      def full_agent_id
        "eyes.selenium.visualgrid.ruby/#{Applitools::VERSION}"
      end

      def configure
        return unless block_given?
        yield(config)
        nil
      end

      def open(*args)
        # visual_grid_manager.add_batch(batch.id) { visual_grid_manager.close_batch(batch.id) }
        # self.test_uuid = SecureRandom.uuid
        options = Applitools::Utils.extract_options!(args)
        universal_open(options)
        # Applitools::ArgumentGuard.hash(options, 'options', [:driver])
        #
        # config.app_name = options[:app_name] if options[:app_name]
        # config.test_name = options[:test_name] if options[:test_name]
        # config.agent_run_id = "#{config.test_name}--#{SecureRandom.hex(10)}"
        #
        # if config.viewport_size.nil? || config.viewport_size && config.viewport_size.empty?
        #   config.viewport_size = Applitools::RectangleSize.from_any_argument(options[:viewport_size]) if options[:viewport_size]
        # end
        #
        # self.driver = Applitools::Selenium::SeleniumEyes.eyes_driver(options.delete(:driver), self)
        # self.current_url = driver.current_url
        #
        # if viewport_size
        #   set_viewport_size(viewport_size)
        # else
        #   self.viewport_size = get_viewport_size
        # end
        #
        # visual_grid_manager.open(self)
        # visual_grid_manager.add_batch(batch.id) do
        #   server_connector.close_batch(batch.id)
        # end
        #
        # logger.info('Getting all browsers info...')
        # browsers_info_list = config.browsers_info
        # logger.info('Creating test descriptors for each browser info...')
        # browsers_info_list.each(viewport_size) do |bi|
        #   test = Applitools::Selenium::RunningTest.new(eyes_connector, bi, driver).tap do |t|
        #     t.on_results_received do |results|
        #       visual_grid_manager.aggregate_result(results)
        #     end
        #     t.test_uuid = test_uuid
        #   end
        #   test_list.push test
        # end
        # self.opened = true
        # driver
      end

      def get_viewport_size(web_driver = driver)
        Applitools::ArgumentGuard.not_nil 'web_driver', web_driver
        # self.utils.extract_viewport_size(driver)
        driver_config_json = universal_driver_config(web_driver)

        Applitools::EyesLogger.debug 'extract_viewport_size()'
        viewport_size = runner.universal_client.core_get_viewport_size(driver_config_json)
        result = Applitools::RectangleSize.new viewport_size[:width], viewport_size[:height]

        Applitools::EyesLogger.debug "Viewport size is #{result}."
        result
      end

      def eyes_connector
        logger.info('Creating VisualGridEyes server connector')
        ::Applitools::Selenium::EyesConnector.new(server_url, driver_lock: driver_lock).tap do |connector|
          connector.batch = batch
          connector.config = config.deep_clone
        end
      end

      def check(*args)
        args.compact!
        case (first_arg = args.shift)
        when String
          tag = first_arg
          target = args.shift
        when Applitools::Selenium::Target
          target = first_arg
        when Hash
          target = first_arg[:target]
          tag = first_arg[:name] || first_arg[:tag]
        end

        render_task = nil
        target.default_full_page_for_vg

        return universal_check(tag, target)

        target_to_check = target.finalize
        begin
          check_in_frame(target_frames: target_to_check.frames) do
            sleep wait_before_screenshots
            Applitools::EyesLogger.info 'Trying to get DOM snapshot...'
            begin
              dont_fetch_resources = self.dont_fetch_resources
              enable_cross_origin_rendering = self.enable_cross_origin_rendering
              use_cookies = !self.dont_use_cookies
              urls_to_skip = visual_grid_manager.resource_cache.urls_to_skip
              dom_script = Applitools::Selenium::DomSnapshotScript.new driver

              script_dom = dom_script.create_dom_snapshot(
                dont_fetch_resources,
                urls_to_skip,
                enable_cross_origin_rendering,
                use_cookies
              )
            rescue StandardError => e
              Applitools::EyesLogger.error e.class.to_s
              Applitools::EyesLogger.error e.message
              raise ::Applitools::EyesError.new 'Error while getting dom snapshot!'
            end
            Applitools::EyesLogger.info 'Done!'

            mod = Digest::SHA2.hexdigest(script_dom.to_s)

            region_x_paths = get_regions_x_paths(target_to_check)

            render_task = RenderTask.new(
              "Render #{config.short_description} - #{tag}",
              script_dom,
              visual_grid_manager,
              server_connector,
              region_x_paths,
              size_mod,
              region_to_check,
              target_to_check.options[:script_hooks],
              config.rendering_grid_force_put,
              self.utils.user_agent(driver),
              visual_grid_options.merge(target_to_check.options[:visual_grid_options]),
              mod
            )
          end

          if size_mod == 'selector' || size_mod == 'full-selector'
            target_to_check.convert_coordinates(&Applitools::Selenium::VgMatchWindowData::CONVERT_COORDINATES)
          end

          title = begin
            driver.title
          rescue StandardError => e
            logger.warn "failed (#{e.message})"
            ''
          end

          test_list.select { |t| t.test_uuid == test_uuid }.each do |t|
            t.check(tag, target_to_check, render_task, title)
          end
          test_list.each(&:becomes_not_rendered)
          visual_grid_manager.enqueue_render_task render_task
        rescue StandardError => e
          test_list.each(&:becomes_tested)
          Applitools::EyesLogger.error e.class.to_s
          Applitools::EyesLogger.error e.message
        end
      end

      def get_regions_x_paths(target)
        result = []
        collect_selenium_regions(target).each do |el, v|
          next unless [::Selenium::WebDriver::Element, Applitools::Selenium::Element].include?(el.class)

          xpath = driver.execute_script(Applitools::Selenium::Scripts::GET_ELEMENT_XPATH_JS, el)
          web_element_region = Applitools::Selenium::WebElementRegion.new(xpath, v)
          self.region_to_check = web_element_region.dup if v == :target && (size_mod == 'selector' || size_mod == 'full-selector')
          result << web_element_region
          target.regions[el] = result.size - 1
        end
        result
      end

      def collect_selenium_regions(target)
        selenium_regions = {}
        target_element = target.region_to_check
        setup_size_mode(target_element, target, :none)
        target.ignored_regions.each do |r|
          selenium_regions[element_or_region(r, target, :ignore)] = :ignore
        end
        target.floating_regions.each do |r|
          selenium_regions[element_or_region(r, target, :floating)] = :floating
        end
        target.layout_regions.each do |r|
          selenium_regions[element_or_region(r, target, :layout_regions)] = :layout
        end
        target.strict_regions.each do |r|
          selenium_regions[element_or_region(r, target, :strict_regions)] = :strict
        end
        target.content_regions.each do |r|
          selenium_regions[element_or_region(r, target, :content_regions)] = :content
        end
        target.accessibility_regions.each do |r|
          case (r = element_or_region(r, target, :accessibility_regions))
          when Array
            r.each do |rr|
              selenium_regions[rr] = :accessibility
            end
          else
            selenium_regions[r] = :accessibility
          end
        end
        selenium_regions[region_to_check] = :target if size_mod == 'selector' || size_mod == 'full-selector'

        selenium_regions
      end

      def setup_size_mode(target_element, target, key)
        self.size_mod = 'full-page'

        element_or_region = element_or_region(target_element, target, key)

        self.size_mod = case element_or_region
                        when ::Selenium::WebDriver::Element, Applitools::Selenium::Element
                          if target.options[:stitch_content]
                            'full-selector'
                          else
                            'selector'
                          end
                        when Applitools::Region
                          if element_or_region == Applitools::Region::EMPTY
                            if target.options[:stitch_content]
                              'full-page'
                            else
                              element_or_region = Applitools::Region.from_location_size(
                                Applitools::Location::TOP_LEFT, viewport_size
                              )
                              'region'
                            end
                          else
                            'region'
                          end
                        else
                          'full-page'
                        end

        self.region_to_check = element_or_region
      end

      def element_or_region(target_element, target, options_key)
        if target_element.respond_to?(:call)
          region, padding_proc = target_element.call(driver, true)
          case region
          when Array
            regions_to_replace = region.map { |r| Applitools::Selenium::VGRegion.new(r, padding_proc) }
            target.replace_region(target_element, regions_to_replace, options_key)
          else
            target.replace_region(target_element, Applitools::Selenium::VGRegion.new(region, padding_proc), options_key)
          end
          region
        else
          target_element
        end
      end

      def close_async
        # test_list.each(&:close)
        close(false)
      end

      def close(throw_exception = true)
        logger.info "close(#{throw_exception})"
        logger.info 'Ending server session...'

        universal_results = universal_eyes.close # Array even for one test
        universal_results = universal_eyes.eyes_get_results # Array even for one test
        # require 'pry'
        # binding.pry
        raise Applitools::EyesError.new("Request failed: #{universal_results[:message]}") if server_error?(universal_results)
        results = universal_results.map {|result| Applitools::TestResults.new(result) }
        # results = results.first if results.size == 1
        # session_results_url = results.url
        all_results = results.compact


        # return false if test_list.empty?
        # close_async
        #
        # until (states = test_list.map(&:state_name).uniq).count == 1 && states.first == :completed
        #   sleep 0.5
        # end
        # self.opened = false
        #
        # test_list.select { |t| t.pending_exceptions && !t.pending_exceptions.empty? }.each do |t|
        #   t.pending_exceptions.each do |e|
        #     raise e
        #   end
        # end
        #
        # all_results = test_list.map(&:test_result).compact
        failed_results = all_results.select { |r| !r.as_expected? }

        if throw_exception
          all_results.each do |r|
            raise Applitools::NewTestError.new new_test_error_message(r), r if r.new?
            raise Applitools::DiffsFoundError.new diffs_found_error_message(r), r if r.unresolved? && !r.new?
            raise Applitools::TestFailedError.new test_failed_error_message(r), r if r.failed?
          end
        end

        # failed_results.empty? ? all_results.first : failed_results.first
        all_results.first
      end

      def abort_async
        test_list.each(&:abort)
        universal_sdk_abort
      end

      def abort_if_not_closed
        self.opened = false
        test_list.each(&:abort)
        universal_sdk_abort
      end

      alias abort abort_if_not_closed

      def open?
        opened
      end

      # rubocop:disable Style/AccessorMethodName
      def get_all_test_results
        test_list.map(&:test_result)
      end
      # rubocop:enable Style/AccessorMethodName

      # rubocop:disable Style/AccessorMethodName
      def set_viewport_size(value)
        # require('pry')
        # binding.pry
        self.utils.set_viewport_size driver, value
      rescue => e
        logger.error e.class.to_s
        logger.error e.message
        raise Applitools::TestFailedError.new "#{e.class} - #{e.message}"
      end
      # rubocop:enable Style/AccessorMethodName

      def new_test_error_message(result)
        original_results = result.original_results
        "New test '#{original_results['name']}' " \
            "of '#{original_results['appName']}' " \
            "Please approve the baseline at #{original_results['appUrls']['session']} "
      end

      def diffs_found_error_message(result)
        original_results = result.original_results
        "Test '#{original_results['name']}' " \
            "of '#{original_results['appname']}' " \
            "detected differences! See details at #{original_results['appUrls']['session']}"
      end

      def test_failed_error_message(result)
        original_results = result.original_results
        "Test '#{original_results['name']}' of '#{original_results['appName']}' " \
            "is failed! See details at #{original_results['appUrls']['session']}"
      end

      def server_connector
        @server_connector.server_url = config.server_url
        @server_connector.api_key = config.api_key
        @server_connector.proxy = config.proxy if config.proxy
        @server_connector
      end

      def configuration
        config.deep_dup
      end

      def configuration=(value)
        Applitools::ArgumentGuard.is_a?(value, :configuration, Applitools::Selenium::Configuration)
        self.config = value.deep_dup
      end

      alias get_configuration configuration
      alias set_configuration configuration=

      def add_mouse_trigger(_mouse_action, _element); end

      def add_text_trigger(_control, _text); end

      def disabled=(value)
        @disabled = Applitools::Utils.boolean_value value
      end

      def disabled?
        @disabled
      end

      private :new_test_error_message, :diffs_found_error_message, :test_failed_error_message

      private

      def ensure_frame_visible(*_args); end

      def reset_frames_scroll_position(*_args); end
    end
  end
end
